/**
 * The two people behind the studio. Structural facts only - name, role and
 * bio are translated copy and live under `about.team.*` in `messages/`, the
 * same split `lib/services.ts` uses for the services grid.
 */
export type TeamMember = {
  id: "duje" | "dominko";
  photo: string;
};

export const team: TeamMember[] = [
  { id: "duje", photo: "/staff/duje.avif" },
  { id: "dominko", photo: "/staff/dominko.avif" },
];
