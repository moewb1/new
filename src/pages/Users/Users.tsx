import { Link, Outlet, useLoaderData } from "react-router-dom";

export default function Users() {
  const users = useLoaderData() as Array<{ id: number; name: string }>;
  return (
    <div>
      <h1>Users</h1>
      <ul>
        {users.map((u) => (
          <li key={u.id}>
            <Link to={String(u.id)}>{u.name}</Link>
          </li>
        ))}
      </ul>
      <Outlet />
    </div>
  );
}
