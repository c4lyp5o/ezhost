import { Elysia } from "elysia";
import { verifySession } from "../services/admin";

export const authPlugin = new Elysia({ name: "auth" })
  .derive({ as: "global" }, ({ cookie: { auth } }) => {
    // The cookie holds an opaque session token (never the password), checked
    // against the sessions table — no bcrypt on the request path.
    return { isAdmin: verifySession(auth?.value) };
  })
  .guard({
    beforeHandle({ isAdmin, set }) {
      if (!isAdmin) {
        set.status = 401;
        return { error: "Unauthorized" };
      }
    },
  });
