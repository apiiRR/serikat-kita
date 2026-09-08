export async function authorizeAdmin(
  authorization: string | null,
  getUser: (token: string) => Promise<{ id: string } | null>,
  isAdmin: (userId: string) => Promise<boolean>,
) {
  const token = authorization?.match(/^Bearer\s+(.+)$/i)?.[1];
  if (!token) throw new Error("UNAUTHORIZED");
  const user = await getUser(token);
  if (!user) throw new Error("UNAUTHORIZED");
  if (!(await isAdmin(user.id))) throw new Error("FORBIDDEN");
  return user.id;
}
