"use client";

import { useActionState, useEffect, useState } from "react";
import { createSchoolImageUploadUrlAction, attachSchoolImageAction } from "@/lib/actions/upload-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface SchoolOption {
  id: string;
  name: string;
}

export function ImageUploadPanel({ schools }: { schools: SchoolOption[] }) {
  const [state, formAction, pending] = useActionState(createSchoolImageUploadUrlAction, {
    ok: false,
  });
  const [file, setFile] = useState<File | null>(null);
  const [schoolId, setSchoolId] = useState<string>(schools[0]?.id ?? "");
  const [alt, setAlt] = useState("");
  const [uploadedUrl, setUploadedUrl] = useState("");

  useEffect(() => {
    if (!state.ok || !state.signedUrl || !state.publicUrl || !file) return;

    const run = async () => {
      await fetch(state.signedUrl as string, {
        method: "PUT",
        headers: {
          "Content-Type": file.type || "application/octet-stream",
        },
        body: file,
      });
      setUploadedUrl(state.publicUrl as string);
    };

    void run();
  }, [state, file]);

  return (
    <div className="space-y-3 rounded-md border border-border p-3">
      <h3 className="font-semibold">Upload school image (S3/R2)</h3>
      <form action={formAction} className="space-y-3">
        <input type="hidden" name="schoolId" value={schoolId} />
        <input type="hidden" name="filename" value={file?.name ?? ""} />
        <input type="hidden" name="mimeType" value={file?.type ?? "image/jpeg"} />
        {schools.length > 1 ? (
          <select
            className="h-10 w-full rounded-md border border-border bg-white/90 px-3 text-sm"
            value={schoolId}
            onChange={(event) => setSchoolId(event.target.value)}
          >
            {schools.map((school) => (
              <option key={school.id} value={school.id}>
                {school.name}
              </option>
            ))}
          </select>
        ) : (
          <p className="text-sm text-muted-foreground">School: {schools[0]?.name}</p>
        )}

        <Input
          type="file"
          accept="image/*"
          onChange={(event) => setFile(event.target.files?.[0] ?? null)}
          required
        />
        {file ? <p className="text-xs text-muted-foreground">Selected: {file.name}</p> : null}
        <Input
          placeholder="Alt text"
          value={alt}
          onChange={(event) => setAlt(event.target.value)}
        />
        <Button type="submit" disabled={!file || pending}>
          {pending ? "Generating URL..." : "Upload file"}
        </Button>
      </form>

      {state.error ? <p className="text-sm text-red-600">{state.error}</p> : null}

      {uploadedUrl ? (
        <form action={attachSchoolImageAction} className="space-y-2 rounded-md border border-border p-3">
          <p className="text-sm text-muted-foreground">Upload complete. Attach this image to a school record.</p>
          <input type="hidden" name="schoolId" value={schoolId} />
          <input type="hidden" name="url" value={uploadedUrl} />
          <input type="hidden" name="alt" value={alt} />
          <Input value={uploadedUrl} readOnly />
          <Button type="submit" variant="accent">Attach image to school</Button>
        </form>
      ) : null}
    </div>
  );
}
