/**
 * @jest-environment jsdom
 */

// Mock wizard state and functions as they would exist in wizard.js
let currentStep = 1;
const totalSteps = 4;

// Mock DOM elements
const mockStepElements = {
  1: { style: { display: 'block' } },
  2: { style: { display: 'none' } },
  3: { style: { display: 'none' } },
  4: { style: { display: 'none' } }
};

const mockProgressBar = {
  style: { width: '25%' }
};

// Mock functions from wizard.js
function goToStep(step) {
  if (step < 1 || step > totalSteps) {
    return false;
  }
  
  // Hide all steps
  for (let i = 1; i <= totalSteps; i++) {
    mockStepElements[i].style.display = 'none';
  }
  
  // Show target step
  mockStepElements[step].style.display = 'block';
  
  currentStep = step;
  updateProgressBar();
  return true;
}

function updateProgressBar() {
  const progress = (currentStep / totalSteps) * 100;
  mockProgressBar.style.width = `${progress}%`;
}

function canProceedToNextStep() {
  switch (currentStep) {
    case 1:
      return validateStep1();
    case 2:
      return validateStep2();
    case 3:
      return validateStep3();
    case 4:
      return true; // Final step, always valid
    default:
      return false;
  }
}

function validateStep1() {
  // Mock validation: check if template is selected
  return global.template !== undefined;
}

function validateStep2() {
  // Mock validation: check if image is uploaded
  return global.contentImage !== undefined;
}

function validateStep3() {
  // Mock validation: check if logo is selected
  return global.logo !== undefined;
}

function nextStep() {
  if (currentStep < totalSteps && canProceedToNextStep()) {
    return goToStep(currentStep + 1);
  }
  return false;
}

function previousStep() {
  if (currentStep > 1) {
    return goToStep(currentStep - 1);
  }
  return false;
}

function resetWizard() {
  currentStep = 1;
  global.template = undefined;
  global.contentImage = undefined;
  global.logo = undefined;
  return goToStep(1);
}

describe('Wizard Navigation', () => {
  beforeEach(() => {
    // Reset wizard state before each test
    currentStep = 1;
    global.template = undefined;
    global.contentImage = undefined;
    global.logo = undefined;
    
    // Reset mock DOM elements
    for (let i = 1; i <= totalSteps; i++) {
      mockStepElements[i].style.display = i === 1 ? 'block' : 'none';
    }
    mockProgressBar.style.width = '25%';
  });

  describe('goToStep', () => {
    test('should navigate to valid step', () => {
      const result = goToStep(2);
      
      expect(result).toBe(true);
      expect(currentStep).toBe(2);
      expect(mockStepElements[1].style.display).toBe('none');
      expect(mockStepElements[2].style.display).toBe('block');
    });

    test('should not navigate to invalid step (too low)', () => {
      const result = goToStep(0);
      
      expect(result).toBe(false);
      expect(currentStep).toBe(1);
    });

    test('should not navigate to invalid step (too high)', () => {
      const result = goToStep(5);
      
      expect(result).toBe(false);
      expect(currentStep).toBe(1);
    });

    test('should update progress bar', () => {
      goToStep(3);
      
      expect(mockProgressBar.style.width).toBe('75%');
    });
  });

  describe('updateProgressBar', () => {
    test('should calculate correct progress for each step', () => {
      currentStep = 1;
      updateProgressBar();
      expect(mockProgressBar.style.width).toBe('25%');

      currentStep = 2;
      updateProgressBar();
      expect(mockProgressBar.style.width).toBe('50%');

      currentStep = 3;
      updateProgressBar();
      expect(mockProgressBar.style.width).toBe('75%');

      currentStep = 4;
      updateProgressBar();
      expect(mockProgressBar.style.width).toBe('100%');
    });
  });

  describe('Step validation', () => {
    test('validateStep1 should require template', () => {
      expect(validateStep1()).toBe(false);
      
      global.template = { name: 'story' };
      expect(validateStep1()).toBe(true);
    });

    test('validateStep2 should require content image', () => {
      expect(validateStep2()).toBe(false);
      
      global.contentImage = { src: 'test.jpg' };
      expect(validateStep2()).toBe(true);
    });

    test('validateStep3 should require logo', () => {
      expect(validateStep3()).toBe(false);
      
      global.logo = { filename: 'wien.png' };
      expect(validateStep3()).toBe(true);
    });
  });

  describe('canProceedToNextStep', () => {
    test('should check validation for current step', () => {
      currentStep = 1;
      expect(canProceedToNextStep()).toBe(false);
      
      global.template = { name: 'story' };
      expect(canProceedToNextStep()).toBe(true);
    });

    test('should always allow step 4', () => {
      currentStep = 4;
      expect(canProceedToNextStep()).toBe(true);
    });
  });

  describe('nextStep', () => {
    test('should advance to next step when validation passes', () => {
      global.template = { name: 'story' };
      
      const result = nextStep();
      
      expect(result).toBe(true);
      expect(currentStep).toBe(2);
    });

    test('should not advance when validation fails', () => {
      const result = nextStep();
      
      expect(result).toBe(false);
      expect(currentStep).toBe(1);
    });

    test('should not advance beyond final step', () => {
      currentStep = 4;
      
      const result = nextStep();
      
      expect(result).toBe(false);
      expect(currentStep).toBe(4);
    });
  });

  describe('previousStep', () => {
    test('should go back to previous step', () => {
      currentStep = 3;
      
      const result = previousStep();
      
      expect(result).toBe(true);
      expect(currentStep).toBe(2);
    });

    test('should not go back from first step', () => {
      currentStep = 1;
      
      const result = previousStep();
      
      expect(result).toBe(false);
      expect(currentStep).toBe(1);
    });
  });

  describe('resetWizard', () => {
    test('should reset wizard to initial state', () => {
      currentStep = 3;
      global.template = { name: 'story' };
      global.contentImage = { src: 'test.jpg' };
      global.logo = { filename: 'wien.png' };
      
      const result = resetWizard();
      
      expect(result).toBe(true);
      expect(currentStep).toBe(1);
      expect(global.template).toBeUndefined();
      expect(global.contentImage).toBeUndefined();
      expect(global.logo).toBeUndefined();
    });
  });
});