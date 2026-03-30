/**
 * Authentication middleware stub.
 * TODO: Integrate Keycloak JWT verification.
 */
import type { Request, Response, NextFunction } from 'express';

export interface AuthenticatedRequest extends Request {
  userId?: string;
  userRoles?: string[];
}

/**
 * Auth middleware - currently passes through all requests.
 * TODO: Verify JWT from Authorization header using Keycloak public key.
 *
 * Expected header: Authorization: Bearer <jwt>
 * After verification, populates req.userId and req.userRoles.
 */
export function authMiddleware(
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction,
): void {
  // TODO: Implement Keycloak JWT verification
  // const token = req.headers.authorization?.replace('Bearer ', '');
  // if (!token) return res.status(401).json({ error: 'Missing authorization token' });
  // try {
  //   const decoded = verifyKeycloakToken(token);
  //   req.userId = decoded.sub;
  //   req.userRoles = decoded.realm_access?.roles ?? [];
  // } catch {
  //   return res.status(401).json({ error: 'Invalid or expired token' });
  // }

  // Stub: assign a default user for development
  req.userId = 'dev-user-001';
  req.userRoles = ['user'];
  next();
}
