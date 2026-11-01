/** Select one queue worker per PM2 application; standalone Node remains supported. */
export const shouldRunNotificationWorker = (environment: NodeJS.ProcessEnv = process.env): boolean => {
  if (environment.NOTIFICATION_WORKER_ENABLED === "false") return false;
  const instanceVariable = environment.NOTIFICATION_WORKER_INSTANCE_VAR || "NODE_APP_INSTANCE";
  const instance = environment[instanceVariable];
  return instance === undefined || instance === "0";
};
