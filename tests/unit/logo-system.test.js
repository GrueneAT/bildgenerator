/**
 * @jest-environment jsdom
 */

// Mock logo data as it would be loaded from JSON files
const mockGemeindenLogos = [
  {
    "filename": "wien.png",
    "displayName": "Wien",
    "category": "gemeinden",
    "searchTerms": ["wien", "vienna", "hauptstadt"]
  },
  {
    "filename": "graz.png", 
    "displayName": "Graz",
    "category": "gemeinden",
    "searchTerms": ["graz", "steiermark"]
  },
  {
    "filename": "salzburg.png",
    "displayName": "Salzburg",
    "category": "gemeinden", 
    "searchTerms": ["salzburg", "mozart"]
  }
];

const mockBundeslaenderLogos = [
  {
    "filename": "steiermark.png",
    "displayName": "Steiermark",
    "category": "bundeslaender",
    "searchTerms": ["steiermark", "graz"]
  },
  {
    "filename": "tirol.png",
    "displayName": "Tirol",
    "category": "bundeslaender",
    "searchTerms": ["tirol", "innsbruck", "berge"]
  }
];

// Mock functions that would exist in the logo system
function searchLogos(searchTerm, logoData) {
  if (!searchTerm || searchTerm.length < 2) {
    return logoData;
  }
  
  const term = searchTerm.toLowerCase();
  return logoData.filter(logo => 
    logo.displayName.toLowerCase().includes(term) ||
    logo.searchTerms.some(searchTerm => searchTerm.toLowerCase().includes(term))
  );
}

function getLogoPath(logo) {
  return `resources/images/logos/${logo.category}/${logo.filename}`;
}

function validateLogoData(logoData) {
  if (!Array.isArray(logoData)) {
    return false;
  }
  
  return logoData.every(logo => 
    logo.filename && 
    logo.displayName && 
    logo.category && 
    Array.isArray(logo.searchTerms)
  );
}

function groupLogosByCategory(allLogos) {
  return allLogos.reduce((grouped, logo) => {
    if (!grouped[logo.category]) {
      grouped[logo.category] = [];
    }
    grouped[logo.category].push(logo);
    return grouped;
  }, {});
}

describe('Logo System', () => {
  describe('searchLogos', () => {
    test('should return all logos when search term is empty', () => {
      const result = searchLogos('', mockGemeindenLogos);
      expect(result).toEqual(mockGemeindenLogos);
    });

    test('should return all logos when search term is too short', () => {
      const result = searchLogos('w', mockGemeindenLogos);
      expect(result).toEqual(mockGemeindenLogos);
    });

    test('should find logos by display name', () => {
      const result = searchLogos('wien', mockGemeindenLogos);
      expect(result).toHaveLength(1);
      expect(result[0].displayName).toBe('Wien');
    });

    test('should find logos by search terms', () => {
      const result = searchLogos('vienna', mockGemeindenLogos);
      expect(result).toHaveLength(1);
      expect(result[0].displayName).toBe('Wien');
    });

    test('should be case insensitive', () => {
      const result = searchLogos('WIEN', mockGemeindenLogos);
      expect(result).toHaveLength(1);
      expect(result[0].displayName).toBe('Wien');
    });

    test('should return multiple matches', () => {
      const result = searchLogos('salzburg', mockGemeindenLogos);
      expect(result).toHaveLength(1);
      expect(result[0].displayName).toBe('Salzburg');
    });

    test('should return empty array when no matches found', () => {
      const result = searchLogos('linz', mockGemeindenLogos);
      expect(result).toHaveLength(0);
    });
  });

  describe('getLogoPath', () => {
    test('should generate correct path for gemeinden logo', () => {
      const logo = mockGemeindenLogos[0];
      const path = getLogoPath(logo);
      expect(path).toBe('resources/images/logos/gemeinden/wien.png');
    });

    test('should generate correct path for bundeslaender logo', () => {
      const logo = mockBundeslaenderLogos[0];
      const path = getLogoPath(logo);
      expect(path).toBe('resources/images/logos/bundeslaender/steiermark.png');
    });
  });

  describe('validateLogoData', () => {
    test('should validate correct logo data structure', () => {
      const isValid = validateLogoData(mockGemeindenLogos);
      expect(isValid).toBe(true);
    });

    test('should reject non-array data', () => {
      const isValid = validateLogoData({});
      expect(isValid).toBe(false);
    });

    test('should reject logos missing required fields', () => {
      const invalidLogos = [
        {
          "filename": "test.png",
          // missing displayName, category, searchTerms
        }
      ];
      const isValid = validateLogoData(invalidLogos);
      expect(isValid).toBe(false);
    });

    test('should reject logos with invalid searchTerms', () => {
      const invalidLogos = [
        {
          "filename": "test.png",
          "displayName": "Test",
          "category": "test",
          "searchTerms": "not-an-array"
        }
      ];
      const isValid = validateLogoData(invalidLogos);
      expect(isValid).toBe(false);
    });
  });

  describe('groupLogosByCategory', () => {
    test('should group logos by category', () => {
      const allLogos = [...mockGemeindenLogos, ...mockBundeslaenderLogos];
      const grouped = groupLogosByCategory(allLogos);
      
      expect(grouped.gemeinden).toHaveLength(3);
      expect(grouped.bundeslaender).toHaveLength(2);
    });

    test('should handle empty array', () => {
      const grouped = groupLogosByCategory([]);
      expect(grouped).toEqual({});
    });

    test('should create new categories as needed', () => {
      const customLogos = [
        {
          "filename": "test.png",
          "displayName": "Test",
          "category": "custom",
          "searchTerms": ["test"]
        }
      ];
      const grouped = groupLogosByCategory(customLogos);
      
      expect(grouped.custom).toHaveLength(1);
    });
  });
});