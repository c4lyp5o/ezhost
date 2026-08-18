import { Elysia, t } from "elysia";
import { verifyAdmin } from "../services/admin";

export const authPlugin = new Elysia({ name: "auth" })
  .derive({ as: "global" }, async ({ cookie: { auth }, set }) => {
    const token = auth?.value;
    if (!token) return { isAdmin: false };

    // Simple token verification - in production you'd use JWT
    const admin = await verifyAdmin("admin", token);
    return { isAdmin: !!admin };
  })
  .guard({
    beforeHandle({ isAdmin, set }) {
      if (!isAdmin) {
        set.status = 401;
        return { error: "Unauthorized" };
      }
    },
  });