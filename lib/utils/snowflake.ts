import { Snowflake } from "nodejs-snowflake";

export const snowflake = () => {
  const uid = new Snowflake();
  return uid.getUniqueID().toString();
};
