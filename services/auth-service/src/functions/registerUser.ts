import { GSContext, GSStatus, PlainObject, GSDataSource } from "@godspeedsystems/core";
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

  const client: GSDataSource = ctx.datasources.userService;

    const axiosResponse =  await client.execute(ctx, {
        meta: {
            method: 'post',
            url: '/user',
        },
        data: {
              "email": email,
              "passwordHash": passwordHash,
              "role": role,
            },
    });
    
    // axiosResponse.headers = {
    //     'Content-Type': 'application/json'
    // };

  // Send the user data to user-service via Axios datasource
  // const axiosResponse = await datasources.userService.execute(ctx, {
  //   method: "POST",
  //   url: "/user", 
  //   data: {
  //     email,
  //     passwordHash,
  //     role,
  //   },
  // });

  // const axiosResponse = {
  //   data: null
  // }

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
    passwordHash,
    axiosResponse
  });

  // return new GSStatus(true, 201, "User registered successfully");
}



// import { GSCloudEvent, GSContext,GSStatus, PlainObject } from "@godspeedsystems/core";
// import Pino from 'pino';
// import crypto from "crypto";

// //  * Hash the password using pbkdf2 with salt.
// //  * Format: salt:hash
// //  */
// const hashPassword = (password: string): Promise<string> => {
//   return new Promise((resolve, reject) => {
//     const salt = crypto.randomBytes(16).toString("hex");
//     crypto.pbkdf2(password, salt, 100000, 64, "sha512", (err, derivedKey) => {
//       if (err) return reject(err);
//       resolve(`${salt}:${derivedKey.toString("hex")}`);
//     });
//   });
// };
// export default  async function (ctx: GSContext, args: any) {
//     const {
//         inputs: {
//             data: {
//                 params, //path parameters from endpoint url
//                 body,  // request body in case of http and graphql apis, event data in case of message bus or socket
//                 query, // query parameters from rest api
//                 user,  // user payload parsed from jwt token
//                 headers //request headers in case of http and graphql apis
//             }
//         }, 
//         childLogger, // context specific logger. Read pino childLogger for more information
//         logger, // Basic logger of the project, generally prefer childLogger for logging 
//         outputs, // outputs of previously executed tasks of yaml workflows (if any)
//         functions, // all loaded workflows/functions from the src/functions/ folder
//         datasources, //all configured datasources from src/datasources
//         mappings  //mappings from src/mappings folder. this is useful for loading key value configurations for business logic of your project
//     }: {
//         inputs: GSCloudEvent, 
//         childLogger: Pino.Logger, // you can also add custom attributes to childLogger
//         logger: Pino.Logger,
//         outputs: PlainObject, 
//         functions: PlainObject, 
//         datasources: PlainObject,
//         mappings: PlainObject
//     } = ctx;

//     const { email, password, role } = ctx.inputs.data.body;

//   if (!email || !password || !role) {
//     return new GSStatus(false, 400, "Missing required fields", {
//       missing: ["email", "password", "role"],
//     });
//   }

//   const passwordHash = await hashPassword(password);

//   // Send the user data to user-service via Axios datasource
//   const axiosResponse = await datasources.userService.execute(ctx, {
//     method: "POST",
//     url: "/user", 
//     data: {
//       email,
//       passwordHash,
//       role,
//     },
//   });

//     // Will print with workflow_name and task_id attributes. 
//     childLogger.info('Server is running healthy');
//     // Will print without workflow_name and task_id attributes
//     logger.info('Inputs object \n user %o query %o body %o headers %o params %o', user, query, body, headers, params);
//     logger.info('Outputs object has outputs from previous tasks with given ids %o', Object.keys(outputs));
//     logger.info('Datasources object has following datasource clients %o', Object.keys(datasources));
//     logger.info('Total functions found in the project %s', Object.keys(functions).length);

//     // Returning only data
//    // return 'Its working! ' + body.name;

//     //SAME AS
//     return {
//         data: 'Registered Succesfully! ' + body.name,
//         code: 200,
//         // success: true,
//         // headers: undefined
//     }
//     //SAME AS
//     return {
//         data: 'Its working! ' + body.name,
//         code: 200,
//         success: true,
//         headers: undefined // or u can set response headers as key: value pairs, 
//         //for example headers:{custom-header1:"xyz" }
//     }
// }