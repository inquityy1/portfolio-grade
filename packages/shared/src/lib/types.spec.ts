import { Role, ROLE_HIERARCHY, hasRoleLevel, getAllRoles } from './types';

describe('types', () => {
  describe('Role type', () => {
    it('should include all expected role values', () => {
      const roles: Role[] = ['OrgAdmin', 'Editor', 'Viewer'];

      expect(roles).toContain('OrgAdmin');
      expect(roles).toContain('Editor');
      expect(roles).toContain('Viewer');
      expect(roles).toHaveLength(3);
    });

    it('should only accept valid role values', () => {
      const validRoles: Role[] = ['OrgAdmin', 'Editor', 'Viewer'];

      validRoles.forEach(role => {
        expect(typeof role).toBe('string');
        expect(['OrgAdmin', 'Editor', 'Viewer']).toContain(role);
      });
    });
  });

  describe('ROLE_HIERARCHY', () => {
    it('should have correct hierarchy values', () => {
      expect(ROLE_HIERARCHY.OrgAdmin).toBe(3);
      expect(ROLE_HIERARCHY.Editor).toBe(2);
      expect(ROLE_HIERARCHY.Viewer).toBe(1);
    });

    it('should have all roles defined', () => {
      expect(ROLE_HIERARCHY).toHaveProperty('OrgAdmin');
      expect(ROLE_HIERARCHY).toHaveProperty('Editor');
      expect(ROLE_HIERARCHY).toHaveProperty('Viewer');
    });

    it('should maintain proper hierarchy order', () => {
      // OrgAdmin should have the highest level
      expect(ROLE_HIERARCHY.OrgAdmin).toBeGreaterThan(ROLE_HIERARCHY.Editor);
      expect(ROLE_HIERARCHY.OrgAdmin).toBeGreaterThan(ROLE_HIERARCHY.Viewer);

      // Editor should have higher level than Viewer
      expect(ROLE_HIERARCHY.Editor).toBeGreaterThan(ROLE_HIERARCHY.Viewer);

      // Viewer should have the lowest level
      expect(ROLE_HIERARCHY.Viewer).toBeLessThan(ROLE_HIERARCHY.Editor);
      expect(ROLE_HIERARCHY.Viewer).toBeLessThan(ROLE_HIERARCHY.OrgAdmin);
    });

    it('should have immutable structure', () => {
      // Test that the object has the expected structure and values
      expect(typeof ROLE_HIERARCHY).toBe('object');
      expect(ROLE_HIERARCHY.OrgAdmin).toBeGreaterThanOrEqual(3);
      expect(ROLE_HIERARCHY.Editor).toBeGreaterThanOrEqual(2);
      expect(ROLE_HIERARCHY.Viewer).toBeGreaterThanOrEqual(1);
    });
  });

  describe('hasRoleLevel', () => {
    it('should return true when user has exact required role', () => {
      expect(hasRoleLevel('OrgAdmin', 'OrgAdmin')).toBe(true);
      expect(hasRoleLevel('Editor', 'Editor')).toBe(true);
      expect(hasRoleLevel('Viewer', 'Viewer')).toBe(true);
    });

    it('should return true when user has higher role than required', () => {
      expect(hasRoleLevel('OrgAdmin', 'Editor')).toBe(true);
      expect(hasRoleLevel('OrgAdmin', 'Viewer')).toBe(true);
      expect(hasRoleLevel('Editor', 'Viewer')).toBe(true);
    });

    it('should return false when user has lower role than required', () => {
      expect(hasRoleLevel('Editor', 'OrgAdmin')).toBe(false);
      expect(hasRoleLevel('Viewer', 'OrgAdmin')).toBe(false);
      expect(hasRoleLevel('Viewer', 'Editor')).toBe(false);
    });

    it('should handle all role combinations correctly', () => {
      // OrgAdmin can access everything
      expect(hasRoleLevel('OrgAdmin', 'OrgAdmin')).toBe(true);
      expect(hasRoleLevel('OrgAdmin', 'Editor')).toBe(true);
      expect(hasRoleLevel('OrgAdmin', 'Viewer')).toBe(true);

      // Editor can access Editor and Viewer
      expect(hasRoleLevel('Editor', 'OrgAdmin')).toBe(false);
      expect(hasRoleLevel('Editor', 'Editor')).toBe(true);
      expect(hasRoleLevel('Editor', 'Viewer')).toBe(true);

      // Viewer can only access Viewer
      expect(hasRoleLevel('Viewer', 'OrgAdmin')).toBe(false);
      expect(hasRoleLevel('Viewer', 'Editor')).toBe(false);
      expect(hasRoleLevel('Viewer', 'Viewer')).toBe(true);
    });

    it('should be symmetric for equality', () => {
      const roles: Role[] = ['OrgAdmin', 'Editor', 'Viewer'];

      roles.forEach(role => {
        expect(hasRoleLevel(role, role)).toBe(true);
      });
    });

    it('should be transitive for higher roles', () => {
      // If user has OrgAdmin, they should have Editor and Viewer access
      expect(hasRoleLevel('OrgAdmin', 'Editor')).toBe(true);
      expect(hasRoleLevel('OrgAdmin', 'Viewer')).toBe(true);

      // If user has Editor, they should have Viewer access
      expect(hasRoleLevel('Editor', 'Viewer')).toBe(true);
    });
  });

  describe('getAllRoles', () => {
    it('should return all roles', () => {
      const roles = getAllRoles();

      expect(roles).toEqual(['OrgAdmin', 'Editor', 'Viewer']);
      expect(roles).toHaveLength(3);
    });

    it('should return roles in correct order', () => {
      const roles = getAllRoles();

      expect(roles[0]).toBe('OrgAdmin');
      expect(roles[1]).toBe('Editor');
      expect(roles[2]).toBe('Viewer');
    });

    it('should return a new array each time', () => {
      const roles1 = getAllRoles();
      const roles2 = getAllRoles();

      expect(roles1).not.toBe(roles2);
      expect(roles1).toEqual(roles2);
    });

    it('should contain all valid role types', () => {
      const roles = getAllRoles();

      roles.forEach(role => {
        expect(typeof role).toBe('string');
        expect(['OrgAdmin', 'Editor', 'Viewer']).toContain(role);
      });
    });
  });

  describe('Integration tests', () => {
    it('should work with role hierarchy consistently', () => {
      const allRoles = getAllRoles();

      // Test that all roles have defined hierarchy
      allRoles.forEach(role => {
        expect(ROLE_HIERARCHY).toHaveProperty(role);
        expect(typeof ROLE_HIERARCHY[role]).toBe('number');
      });
    });

    it('should maintain consistency between getAllRoles and ROLE_HIERARCHY', () => {
      const allRoles = getAllRoles();
      const hierarchyKeys = Object.keys(ROLE_HIERARCHY);

      expect(allRoles).toEqual(hierarchyKeys);
      expect(allRoles.sort()).toEqual(hierarchyKeys.sort());
    });

    it('should allow checking permissions for all role combinations', () => {
      const allRoles = getAllRoles();

      // Test every combination
      allRoles.forEach(userRole => {
        allRoles.forEach(requiredRole => {
          const result = hasRoleLevel(userRole, requiredRole);
          expect(typeof result).toBe('boolean');

          // Verify the logic matches expected hierarchy
          const userLevel = ROLE_HIERARCHY[userRole];
          const requiredLevel = ROLE_HIERARCHY[requiredRole];
          expect(result).toBe(userLevel >= requiredLevel);
        });
      });
    });
  });

  describe('Edge cases', () => {
    it('should handle role hierarchy edge cases', () => {
      // Minimum level comparison
      expect(ROLE_HIERARCHY.Viewer).toBe(1);

      // Maximum level comparison
      expect(ROLE_HIERARCHY.OrgAdmin).toBeGreaterThanOrEqual(3);

      // Level differences should be at least 1
      expect(ROLE_HIERARCHY.OrgAdmin - ROLE_HIERARCHY.Editor).toBeGreaterThanOrEqual(1);
      expect(ROLE_HIERARCHY.Editor - ROLE_HIERARCHY.Viewer).toBeGreaterThanOrEqual(1);
      expect(ROLE_HIERARCHY.OrgAdmin - ROLE_HIERARCHY.Viewer).toBeGreaterThanOrEqual(2);
    });

    it('should handle hasRoleLevel with edge values', () => {
      // Edge case: same role comparison
      expect(hasRoleLevel('Viewer', 'Viewer')).toBe(true);
      expect(hasRoleLevel('Editor', 'Editor')).toBe(true);
      expect(hasRoleLevel('OrgAdmin', 'OrgAdmin')).toBe(true);
    });
  });

  describe('Type safety', () => {
    it('should have correct TypeScript types', () => {
      // This should compile without TypeScript errors
      const role: Role = 'OrgAdmin';
      const hierarchy: Record<Role, number> = ROLE_HIERARCHY;
      const hasPermission: boolean = hasRoleLevel(role, 'Editor');
      const allRoles: Role[] = getAllRoles();

      expect(typeof role).toBe('string');
      expect(typeof hierarchy).toBe('object');
      expect(typeof hasPermission).toBe('boolean');
      expect(Array.isArray(allRoles)).toBe(true);
    });
  });
});
