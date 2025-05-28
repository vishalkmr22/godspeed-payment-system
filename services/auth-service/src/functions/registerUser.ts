import { GSContext, GSStatus, PlainObject } from "@godspeedsystems/core";
import crypto from "crypto";

/**
 * Hash the password using pbkdf2 with salt.
 * Format: salt:hash
 */
const hashPassword = (password: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const salt = crypto.randomBytes(16).toString("hex");
    crypto.pbkdf2(password, salt, 100000, 64, "sha512", (err, derivedKey) => {
      if (err) return reject(err);
      resolve(`${salt}:${derivedKey.toString("hex")}`);
    });
  });
};

export default async function registerUser(ctx: GSContext) {
  const {
    inputs: {
      data: { body },
    },
    logger,
    datasources,
  } = ctx;

  const { email, password, role } = ctx.inputs.data.body;

  if (!email || !password || !role) {
    return new GSStatus(false, 400, "Missing required fields", {
      missing: ["email", "password", "role"],
    });
  }

  const passwordHash = await hashPassword(password);

  // Send the user data to user-service via Axios datasource
  const axiosResponse = await datasources.userService.execute(ctx, {
    method: "POST",
    url: "/user", 
    data: {
      email,
      passwordHash,
      role,
    },
  });

  logger.info("User registered via auth-service");

  if (!axiosResponse.data) {
    return new GSStatus(false, 500, "Failed to register user", {
      message: "userService did not return data",
    });
  }
  const { data: userServiceData } = axiosResponse;
  return new GSStatus(true, 201, "User registered successfully", {
    userId: userServiceData.userId,
    email: userServiceData.email,
    role: userServiceData.role,
    status: userServiceData.status,
  });
}