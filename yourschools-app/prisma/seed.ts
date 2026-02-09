import bcrypt from "bcryptjs";
import {
  ClaimStatus,
  FlagStatus,
  MembershipStatus,
  PrismaClient,
  ReviewStatus,
  SchoolMembershipRole,
  UserRole,
} from "@prisma/client";

const prisma = new PrismaClient();
const defaultPassword = "ChangeMe123!";

const imagePool = [
  "https://picsum.photos/id/1025/1600/1000",
  "https://picsum.photos/id/1035/1600/1000",
  "https://picsum.photos/id/1041/1600/1000",
  "https://picsum.photos/id/1050/1600/1000",
  "https://picsum.photos/id/1062/1600/1000",
  "https://picsum.photos/id/1074/1600/1000",
  "https://picsum.photos/id/1084/1600/1000",
  "https://picsum.photos/id/1080/1600/1000",
  "https://picsum.photos/id/1068/1600/1000",
];

const citySeeds = [
  { city: "Virginia Beach", state: "VA", zipcode: "23451", lat: 36.8529, lng: -75.978 },
  { city: "Norfolk", state: "VA", zipcode: "23502", lat: 36.8471, lng: -76.2859 },
  { city: "Chesapeake", state: "VA", zipcode: "23320", lat: 36.7682, lng: -76.2875 },
  { city: "Suffolk", state: "VA", zipcode: "23434", lat: 36.7282, lng: -76.5836 },
  { city: "Portsmouth", state: "VA", zipcode: "23704", lat: 36.8354, lng: -76.2983 },
  { city: "Newport News", state: "VA", zipcode: "23606", lat: 37.0871, lng: -76.473 },
];

const schoolPrefixes = [
  "Harbor Bloom",
  "Northlight Montessori",
  "Little Oaks",
  "Emmanuel Episcopal",
  "St. Gregory",
  "Harmony",
  "Children's Harbor",
  "Sunrise",
  "Maple Grove",
  "Willow Creek",
  "Bluebird",
  "Pinecrest",
  "Cedar Bridge",
  "Bright Horizons",
  "Seaside",
  "Meadow Ridge",
  "Riverside",
  "Oak Terrace",
  "Bayview",
  "Pathfinder",
];

const schoolSuffixes = ["Academy", "Learning Center", "Preschool", "Day School", "Early Learning", "Prep School"];
const reviewBodies = [
  "Strong teacher communication and thoughtful classroom routines.",
  "Our child settled in quickly and comes home excited every day.",
  "Program quality is solid, but enrollment communication can improve.",
  "Great staff, clean facility, and strong curriculum for early learners.",
  "Flexible daycare options and responsive administrative team.",
  "Warm and caring environment with visible student progress.",
  "Positive experience overall and healthy parent-school feedback loop.",
];
const flagReasons = [
  "Potentially inaccurate enrollment details",
  "Contains unsupported allegation",
  "Needs verification for policy claim",
  "Possible misinformation about staffing",
];

function slugify(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function daysAgo(days: number) {
  const now = new Date();
  now.setDate(now.getDate() - days);
  return now;
}

function daysFromNow(days: number) {
  const now = new Date();
  now.setDate(now.getDate() + days);
  return now;
}

let seed = 42042;
function random() {
  seed = (seed * 1664525 + 1013904223) % 4294967296;
  return seed / 4294967296;
}
function randomInt(min: number, max: number) {
  return Math.floor(random() * (max - min + 1)) + min;
}

async function clearData() {
  await prisma.auditLog.deleteMany();
  await prisma.schoolPageView.deleteMany();
  await prisma.schoolMembership.deleteMany();
  await prisma.passwordResetToken.deleteMany();
  await prisma.reviewFlag.deleteMany();
  await prisma.claimRequest.deleteMany();
  await prisma.favorite.deleteMany();
  await prisma.parentPlanItem.deleteMany();
  await prisma.review.deleteMany();
  await prisma.schoolImage.deleteMany();
  await prisma.school.deleteMany();
  await prisma.session.deleteMany();
  await prisma.account.deleteMany();
  await prisma.verificationToken.deleteMany();
  await prisma.user.deleteMany();
}

async function seedUsers(passwordHash: string) {
  const siteAdmins = [
    { email: "admin@yourschools.co", name: "YourSchools Admin", zipcode: "23451", role: UserRole.ADMIN },
    { email: "ops@yourschools.co", name: "Platform Operations", zipcode: "23502", role: UserRole.ADMIN },
  ];
  const schoolAdmins = [
    { email: "schooladmin@yourschools.co", name: "School Admin 1", zipcode: "23502", role: UserRole.USER },
    { email: "schoolowner@yourschools.co", name: "School Owner", zipcode: "23451", role: UserRole.USER },
    ...Array.from({ length: 6 }, (_, index) => ({
      email: `schooladmin${index + 2}@yourschools.co`,
      name: `School Admin ${index + 2}`,
      zipcode: citySeeds[(index + 2) % citySeeds.length].zipcode,
      role: UserRole.USER,
    })),
  ];
  const schoolEditors = Array.from({ length: 10 }, (_, index) => ({
    email: `schooleditor${index + 1}@yourschools.co`,
    name: `School Editor ${index + 1}`,
    zipcode: citySeeds[(index + 2) % citySeeds.length].zipcode,
    role: UserRole.USER,
  }));
  const parents = Array.from({ length: 40 }, (_, index) => ({
    email: index === 0 ? "parent@yourschools.co" : `parent${index + 1}@example.com`,
    name: `Parent ${index + 1}`,
    zipcode: citySeeds[(index + 3) % citySeeds.length].zipcode,
    role: UserRole.USER,
  }));

  const all = [...siteAdmins, ...schoolAdmins, ...schoolEditors, ...parents];
  await prisma.user.createMany({
    data: all.map((user) => ({
      ...user,
      theme: random() > 0.2 ? "light" : "dark",
      passwordHash,
    })),
  });

  const users = await prisma.user.findMany({
    select: { id: true, email: true, role: true },
    orderBy: { email: "asc" },
  });
  const byEmail = new Map(users.map((user) => [user.email, user]));

  return {
    users,
    byEmail,
    siteAdmins: siteAdmins.map((u) => byEmail.get(u.email)!).filter(Boolean),
    schoolAdmins: schoolAdmins.map((u) => byEmail.get(u.email)!).filter(Boolean),
    schoolEditors: schoolEditors.map((u) => byEmail.get(u.email)!).filter(Boolean),
    parents: parents.map((u) => byEmail.get(u.email)!).filter(Boolean),
  };
}

async function seedSchools(adminId: string) {
  const created: { id: string; name: string; slug: string; isVerified: boolean }[] = [];

  for (let index = 0; index < 36; index += 1) {
    const city = citySeeds[index % citySeeds.length];
    const name = `${schoolPrefixes[index % schoolPrefixes.length]} ${schoolSuffixes[index % schoolSuffixes.length]}`;
    const slug = `${slugify(name)}-${index + 1}`;
    const missingGeo = index % 11 === 0;
    const verified = index % 3 === 0;
    const verifiedAt = verified ? daysAgo(randomInt(2, 180)) : null;

    const school = await prisma.school.create({
      data: {
        name,
        slug,
        address: `${100 + index * 7} ${["Oak", "Pine", "River", "Maple", "Cedar"][index % 5]} Street`,
        city: city.city,
        state: city.state,
        zipcode: city.zipcode,
        lat: missingGeo ? null : city.lat + (random() - 0.5) * 0.11,
        lng: missingGeo ? null : city.lng + (random() - 0.5) * 0.11,
        description: `${name} provides structured early education, family communication tools, and enrichment programs for pre-K learners.`,
        phone: `757-55${String(1000 + index).slice(1)}`,
        website: `https://www.${slug}.org`,
        email: `info@${slug}.org`,
        minTuition: randomInt(180, 460),
        maxTuition: randomInt(700, 1850),
        minAge: randomInt(1, 2),
        maxAge: randomInt(5, 7),
        offersDaycare: random() > 0.25,
        earlyEnrollment: random() > 0.35,
        daysOpen: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
        daysClosed: ["Saturday", "Sunday"],
        openingHours: random() > 0.5 ? "07:30" : "08:00",
        closingHours: random() > 0.5 ? "17:30" : "18:00",
        minEnrollment: randomInt(20, 70),
        maxEnrollment: randomInt(90, 220),
        minStudentTeacherRatio: randomInt(4, 8),
        maxStudentTeacherRatio: randomInt(9, 15),
        averageRating: null,
        reviewCount: 0,
        isVerified: verified,
        verifiedAt,
        verifiedByUserId: verified ? adminId : null,
      },
    });

    await prisma.schoolImage.createMany({
      data: Array.from({ length: 3 }, (_, imageIndex) => {
        const url = imagePool[(index + imageIndex) % imagePool.length];
        return {
          schoolId: school.id,
          url: `${url}?auto=format&fit=crop&w=1200&q=80`,
          alt: `${name} campus photo ${imageIndex + 1}`,
          sortOrder: imageIndex,
        };
      }),
    });

    created.push({ id: school.id, name: school.name, slug: school.slug, isVerified: school.isVerified });
  }

  return created;
}

async function main() {
  await clearData();
  const passwordHash = await bcrypt.hash(defaultPassword, 12);
  const seededUsers = await seedUsers(passwordHash);
  const primaryAdminId = seededUsers.siteAdmins[0]?.id;
  if (!primaryAdminId) {
    throw new Error("No site admin seeded.");
  }

  const schools = await seedSchools(primaryAdminId);
  const schoolAdminBySchool = new Map<string, string>();

  const membershipRows: {
    userId: string;
    schoolId: string;
    role: SchoolMembershipRole;
    status: MembershipStatus;
  }[] = [];

  for (let index = 0; index < schools.length; index += 1) {
    const school = schools[index];
    const adminUser = seededUsers.schoolAdmins[index % seededUsers.schoolAdmins.length];
    const editorUser = seededUsers.schoolEditors[index % seededUsers.schoolEditors.length];
    schoolAdminBySchool.set(school.id, adminUser.id);

    membershipRows.push({
      userId: adminUser.id,
      schoolId: school.id,
      role: SchoolMembershipRole.SCHOOL_ADMIN,
      status: MembershipStatus.ACTIVE,
    });
    membershipRows.push({
      userId: editorUser.id,
      schoolId: school.id,
      role: SchoolMembershipRole.SCHOOL_EDITOR,
      status: index % 7 === 0 ? MembershipStatus.SUSPENDED : MembershipStatus.ACTIVE,
    });
    if (index % 5 === 0) {
      membershipRows.push({
        userId: seededUsers.schoolEditors[(index + 2) % seededUsers.schoolEditors.length].id,
        schoolId: school.id,
        role: SchoolMembershipRole.SCHOOL_EDITOR,
        status: MembershipStatus.INVITED,
      });
    }
  }

  const demoSchoolOwner = seededUsers.byEmail.get("schoolowner@yourschools.co");
  if (demoSchoolOwner && schools[0]) {
    await prisma.claimRequest.create({
      data: {
        schoolId: schools[0].id,
        userId: demoSchoolOwner.id,
        fullName: "School Owner",
        workEmail: "schoolowner@yourschools.co",
        phone: "757-555-0100",
        roleTitle: "Owner / Director",
        relationship: "Owner",
        schoolDomain: `${schools[0].slug}.org`,
        proof: "Business registration and ownership proof attached.",
        status: ClaimStatus.APPROVED,
        adminNotes: "Approved for seeded owner persona.",
        reviewedById: primaryAdminId,
        reviewedAt: daysAgo(2),
      },
    });

    await prisma.school.update({
      where: { id: schools[0].id },
      data: {
        isVerified: true,
        verifiedAt: daysAgo(2),
        verifiedByUserId: primaryAdminId,
        claimedByUserId: demoSchoolOwner.id,
      },
    });

    await prisma.schoolMembership.upsert({
      where: {
        userId_schoolId: {
          userId: demoSchoolOwner.id,
          schoolId: schools[0].id,
        },
      },
      update: {
        role: SchoolMembershipRole.SCHOOL_ADMIN,
        status: MembershipStatus.ACTIVE,
      },
      create: {
        userId: demoSchoolOwner.id,
        schoolId: schools[0].id,
        role: SchoolMembershipRole.SCHOOL_ADMIN,
        status: MembershipStatus.ACTIVE,
      },
    });
  }

  await prisma.schoolMembership.createMany({ data: membershipRows, skipDuplicates: true });

  const reviewRecords: { id: string; schoolId: string; userId: string; status: ReviewStatus }[] = [];
  for (let schoolIndex = 0; schoolIndex < schools.length; schoolIndex += 1) {
    const school = schools[schoolIndex];
    const reviewsForSchool = randomInt(4, 14);
    for (let offset = 0; offset < reviewsForSchool; offset += 1) {
      const parent = seededUsers.parents[(schoolIndex * 3 + offset) % seededUsers.parents.length];
      const statusRoll = random();
      const status =
        statusRoll < 0.74 ? ReviewStatus.PUBLISHED
        : statusRoll < 0.88 ? ReviewStatus.FLAGGED
        : statusRoll < 0.95 ? ReviewStatus.HIDDEN
        : ReviewStatus.REMOVED;

      try {
        const review = await prisma.review.create({
          data: {
            schoolId: school.id,
            userId: parent.id,
            rating: randomInt(2, 5),
            body: reviewBodies[(schoolIndex + offset) % reviewBodies.length],
            childAgeYears: randomInt(1, 6),
            attendanceMonths: randomInt(1, 24),
            pros: ["Communication", "Curriculum", "Teacher support", "Safety"][offset % 4],
            cons: ["Waitlist", "Parking", "Tuition changes", "Commute"][offset % 4],
            status,
            createdAt: daysAgo(randomInt(0, 220)),
          },
        });
        reviewRecords.push({
          id: review.id,
          schoolId: school.id,
          userId: parent.id,
          status: review.status,
        });
      } catch {
        // Skip duplicates caused by the one-review-per-user-per-school rule.
      }
    }
  }

  const flagsToCreate = reviewRecords.filter((review, index) => review.status === ReviewStatus.FLAGGED || index % 12 === 0).slice(0, 60);
  for (let index = 0; index < flagsToCreate.length; index += 1) {
    const review = flagsToCreate[index];
    const status =
      index % 3 === 0 ? FlagStatus.PENDING
      : index % 3 === 1 ? FlagStatus.RESOLVED
      : FlagStatus.DISMISSED;
    const reviewerAdmin = seededUsers.siteAdmins[index % seededUsers.siteAdmins.length];
    const schoolResponderId = schoolAdminBySchool.get(review.schoolId) ?? null;

    const created = await prisma.reviewFlag.create({
      data: {
        reviewId: review.id,
        userId: seededUsers.parents[index % seededUsers.parents.length].id,
        reason: flagReasons[index % flagReasons.length],
        status,
        reviewedById: status === FlagStatus.PENDING ? null : reviewerAdmin.id,
        reviewedAt: status === FlagStatus.PENDING ? null : daysAgo(randomInt(0, 21)),
        schoolResponse: index % 2 === 0 ? "School has provided additional documentation for admin review." : null,
        respondedAt: index % 2 === 0 ? daysAgo(randomInt(0, 30)) : null,
        responseUserId: index % 2 === 0 ? schoolResponderId : null,
      },
    });

    if (created.status === FlagStatus.RESOLVED) {
      await prisma.review.update({
        where: { id: review.id },
        data: { status: ReviewStatus.HIDDEN },
      });
    } else if (created.status === FlagStatus.DISMISSED) {
      await prisma.review.update({
        where: { id: review.id },
        data: { status: ReviewStatus.PUBLISHED },
      });
    }
  }

  for (let index = 0; index < schools.length; index += 1) {
    const school = schools[index];
    const claimant = seededUsers.schoolAdmins[(index + 1) % seededUsers.schoolAdmins.length];
    const status =
      index % 6 === 0 ? ClaimStatus.APPROVED
      : index % 6 === 1 ? ClaimStatus.REJECTED
      : index % 6 === 2 ? ClaimStatus.PENDING
      : null;
    if (!status) continue;

    const reviewedBy = seededUsers.siteAdmins[index % seededUsers.siteAdmins.length];
    await prisma.claimRequest.create({
      data: {
        schoolId: school.id,
        userId: claimant.id,
        fullName: `Claimant ${index + 1}`,
        workEmail: claimant.email,
        phone: `757-77${String(2000 + index).slice(1)}`,
        roleTitle: "Director",
        relationship: "School administrator",
        schoolDomain: `${school.slug}.org`,
        proof: "Credential packet uploaded with contact verification.",
        status,
        adminNotes:
          status === ClaimStatus.REJECTED ? "Insufficient identity verification in the submitted packet."
          : status === ClaimStatus.APPROVED ? "Approved after domain and staffing verification."
          : null,
        reviewedById: status === ClaimStatus.PENDING ? null : reviewedBy.id,
        reviewedAt: status === ClaimStatus.PENDING ? null : daysAgo(randomInt(0, 50)),
      },
    });

    if (status === ClaimStatus.APPROVED) {
      await prisma.school.update({
        where: { id: school.id },
        data: {
          isVerified: true,
          verifiedAt: daysAgo(randomInt(1, 120)),
          verifiedByUserId: reviewedBy.id,
          claimedByUserId: claimant.id,
        },
      });

      await prisma.schoolMembership.upsert({
        where: {
          userId_schoolId: {
            userId: claimant.id,
            schoolId: school.id,
          },
        },
        update: {
          role: SchoolMembershipRole.SCHOOL_ADMIN,
          status: MembershipStatus.ACTIVE,
        },
        create: {
          userId: claimant.id,
          schoolId: school.id,
          role: SchoolMembershipRole.SCHOOL_ADMIN,
          status: MembershipStatus.ACTIVE,
        },
      });
    }
  }

  const reviewAgg = await prisma.review.groupBy({
    by: ["schoolId"],
    where: { status: ReviewStatus.PUBLISHED },
    _avg: { rating: true },
    _count: { _all: true },
  });
  for (const aggregate of reviewAgg) {
    await prisma.school.update({
      where: { id: aggregate.schoolId },
      data: {
        averageRating: aggregate._avg.rating ?? null,
        reviewCount: aggregate._count._all,
      },
    });
  }
  await prisma.school.updateMany({
    where: {
      id: {
        notIn: reviewAgg.map((entry) => entry.schoolId),
      },
    },
    data: {
      averageRating: null,
      reviewCount: 0,
    },
  });

  const favoriteRows: { userId: string; schoolId: string }[] = [];
  seededUsers.parents.forEach((parent, index) => {
    for (let offset = 0; offset < 6; offset += 1) {
      favoriteRows.push({
        userId: parent.id,
        schoolId: schools[(index * 2 + offset) % schools.length].id,
      });
    }
  });
  await prisma.favorite.createMany({ data: favoriteRows, skipDuplicates: true });

  const planRows = seededUsers.parents.slice(0, 24).map((parent, index) => ({
    userId: parent.id,
    schoolId: schools[(index * 3) % schools.length].id,
    status: (["SAVED", "TOUR_REQUESTED", "CONTACTED", "APPLIED"] as const)[index % 4],
    notes: `Family note ${index + 1}: prioritize teacher quality and morning drop-off convenience.`,
    remindAt: index % 2 === 0 ? daysFromNow(randomInt(3, 21)) : null,
  }));
  await prisma.parentPlanItem.createMany({ data: planRows, skipDuplicates: true });

  const searchRows = [];
  for (const parent of seededUsers.parents) {
    const city = citySeeds[randomInt(0, citySeeds.length - 1)];
    searchRows.push({
      userId: parent.id,
      query: city.city.toLowerCase(),
      zipcode: city.zipcode,
      town: city.city,
      schoolName: null,
      filtersJson: { town: city.city, zipcode: city.zipcode, sort: "relevance" },
      createdAt: daysAgo(randomInt(0, 25)),
    });
    searchRows.push({
      userId: parent.id,
      query: "daycare verified",
      zipcode: null,
      town: null,
      schoolName: null,
      filtersJson: { daycare: "true", verified: "true", sort: "rating" },
      createdAt: daysAgo(randomInt(0, 40)),
    });
  }
  for (let index = 0; index < 24; index += 1) {
    const city = citySeeds[index % citySeeds.length];
    searchRows.push({
      userId: null,
      query: city.zipcode,
      zipcode: city.zipcode,
      town: null,
      schoolName: null,
      filtersJson: { zipcode: city.zipcode, sort: "distance" },
      createdAt: daysAgo(randomInt(0, 15)),
    });
  }
  await prisma.searchHistory.createMany({ data: searchRows });

  const pageViewRows = [];
  for (const school of schools) {
    const viewCount = randomInt(40, 140);
    for (let index = 0; index < viewCount; index += 1) {
      pageViewRows.push({
        schoolId: school.id,
        viewedAt: daysAgo(randomInt(0, 45)),
        source: ["search", "school_detail", "compare"][index % 3],
      });
    }
  }
  await prisma.schoolPageView.createMany({ data: pageViewRows });

  const resetRows = seededUsers.parents.slice(0, 14).map((parent, index) => ({
    token: `seed-reset-token-${index + 1}-${parent.id}`,
    userId: parent.id,
    expiresAt: index % 3 === 0 ? daysAgo(randomInt(1, 3)) : daysFromNow(randomInt(1, 7)),
    usedAt: index % 4 === 0 ? daysAgo(randomInt(0, 2)) : null,
    createdAt: daysAgo(randomInt(0, 7)),
  }));
  await prisma.passwordResetToken.createMany({ data: resetRows });

  const auditRows = [];
  for (let index = 0; index < 160; index += 1) {
    const actor = seededUsers.users[index % seededUsers.users.length];
    const school = schools[index % schools.length];
    const action = [
      "school_profile_updated",
      "school_images_reordered",
      "review_flag_responded",
      "claim_approved",
      "claim_rejected",
      "school_membership_assigned",
      "school_membership_suspended",
    ][index % 7];
    auditRows.push({
      actorId: actor.id,
      action,
      entityType: action.startsWith("claim") ? "ClaimRequest" : "School",
      entityId: school.id,
      metadata: {
        source: "seed",
        iteration: index + 1,
      },
      createdAt: daysAgo(randomInt(0, 50)),
    });
  }
  await prisma.auditLog.createMany({ data: auditRows });

  const counts = {
    users: await prisma.user.count(),
    schools: await prisma.school.count(),
    reviews: await prisma.review.count(),
    flags: await prisma.reviewFlag.count(),
    claims: await prisma.claimRequest.count(),
    favorites: await prisma.favorite.count(),
    memberships: await prisma.schoolMembership.count(),
    searchHistory: await prisma.searchHistory.count(),
    pageViews: await prisma.schoolPageView.count(),
    auditLogs: await prisma.auditLog.count(),
    parentPlanItems: await prisma.parentPlanItem.count(),
  };

  console.log("Seed complete");
  console.log(`Site admin email: admin@yourschools.co`);
  console.log(`School owner email: schoolowner@yourschools.co`);
  console.log(`School admin email: schooladmin@yourschools.co`);
  console.log(`School editor email: schooleditor1@yourschools.co`);
  console.log(`Parent email: parent@yourschools.co`);
  console.log(`Default password: ${defaultPassword}`);
  console.log("Counts:", counts);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
