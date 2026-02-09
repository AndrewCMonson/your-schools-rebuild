"use client";

import { useMemo } from "react";
import { assignSchoolMembershipAction } from "@/lib/actions/membership-actions";
import { Button } from "@/components/ui/button";

interface AssignUser {
  id: string;
  email: string;
  name: string | null;
}

interface AssignSchool {
  id: string;
  name: string;
}

export function MembershipAssignForm({ users, schools }: { users: AssignUser[]; schools: AssignSchool[] }) {
  const availableUsers = useMemo(() => users.filter((user) => user.email !== "admin@yourschools.co"), [users]);

  return (
    <form action={assignSchoolMembershipAction} className="space-y-3 rounded-md border border-border p-3">
      <h3 className="font-semibold">Assign school member</h3>
      <select name="userId" className="h-10 w-full rounded-md border border-border bg-white/90 px-3 text-sm" required>
        <option value="">Select user</option>
        {availableUsers.map((user) => (
          <option key={user.id} value={user.id}>
            {user.name ? `${user.name} (${user.email})` : user.email}
          </option>
        ))}
      </select>
      <select name="schoolId" className="h-10 w-full rounded-md border border-border bg-white/90 px-3 text-sm" required>
        <option value="">Select school</option>
        {schools.map((school) => (
          <option key={school.id} value={school.id}>
            {school.name}
          </option>
        ))}
      </select>
      <select name="role" className="h-10 w-full rounded-md border border-border bg-white/90 px-3 text-sm" defaultValue="SCHOOL_EDITOR">
        <option value="SCHOOL_EDITOR">School Editor</option>
        <option value="SCHOOL_ADMIN">School Admin</option>
      </select>
      <Button type="submit" size="sm">Assign membership</Button>
    </form>
  );
}
