import { GSContext, PlainObject, GSStatus } from "@godspeedsystems/core";

export default async function registerUserToDB(ctx: GSContext, args: PlainObject) {
  const {
    inputs: {
      data: { body },
    },
    datasources,
  } = ctx;

  const { email, passwordHash, role } = body;

  // Validate the required fields
  if (!email || !passwordHash || !Array.isArray(role) || role.length === 0) {
    return new GSStatus(false, 400, "Missing or invalid required fields", {
      missing: [
        !email && "email",
        !passwordHash && "passwordHash",
        (!role || role.length === 0) && "role",
      ].filter(Boolean),
    });
  }

  const prismaClient = datasources.schema.client;

  // Check if user already exists in the database
  const existingUser = await prismaClient.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    return new GSStatus(false, 409, "User already exists", { email });
  }

  // Create the user if it doesnot exist in the database
  const user = await prismaClient.user.create({
    data: {
      email,
      passwordHash,
      role,
    },
  });

  return new GSStatus(true, 201, "User created successfully", {
    userId: user.id,
    email: user.email,
    role: user.role,
    status: user.status,
  });
}
