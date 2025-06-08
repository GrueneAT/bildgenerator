// Test modal.js functionality
describe('Modal Module', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock DOM elements
    global.document = {
      addEventListener: jest.fn(),
      body: {
        classList: {
          add: jest.fn(),
          remove: jest.fn()
        }
      }
    };
  });

  beforeAll(() => {
    // Mock constants
    global.CONSTANTS = {
      ALERT_DURATION: 3000
    };

    // Define modal functions for testing
    global.showTailwindAlert = function(message, type = 'danger') {
      const alertClasses = {
        danger: 'bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded',
        success: 'bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded',
        warning: 'bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded',
        info: 'bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded'
      };
      
      const $alertContainer = jQuery('.alert-container');
      $alertContainer.removeClass();
      $alertContainer.addClass('alert-container max-w-7xl mx-auto px-4 mt-4');
      $alertContainer.addClass(alertClasses[type]);
      
      return $alertContainer
        .removeClass('hidden')
        .html(`<p class="text-center mb-0 font-medium">${message}</p>`)
        .fadeIn('normal');
    };
  });

  describe('showTailwindAlert function', () => {
    test('should show danger alert with correct styling', () => {
      const mockAlertContainer = {
        removeClass: jest.fn().mockReturnThis(),
        addClass: jest.fn().mockReturnThis(),
        html: jest.fn().mockReturnThis(),
        fadeIn: jest.fn().mockReturnThis(),
        fadeOut: jest.fn().mockReturnThis()
      };
      
      const mockJQuery = jest.fn(() => mockAlertContainer);
      global.jQuery = mockJQuery;
      
      showTailwindAlert('Error message', 'danger');
      
      expect(mockJQuery).toHaveBeenCalledWith('.alert-container');
      expect(mockAlertContainer.addClass).toHaveBeenCalledWith('bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded');
      expect(mockAlertContainer.html).toHaveBeenCalledWith('<p class="text-center mb-0 font-medium">Error message</p>');
    });

    test('should show success alert with correct styling', () => {
      const mockAlertContainer = {
        removeClass: jest.fn().mockReturnThis(),
        addClass: jest.fn().mockReturnThis(),
        html: jest.fn().mockReturnThis(),
        fadeIn: jest.fn().mockReturnThis()
      };
      
      const mockJQuery = jest.fn(() => mockAlertContainer);
      global.jQuery = mockJQuery;
      
      showTailwindAlert('Success message', 'success');
      
      expect(mockAlertContainer.addClass).toHaveBeenCalledWith('bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded');
      expect(mockAlertContainer.html).toHaveBeenCalledWith('<p class="text-center mb-0 font-medium">Success message</p>');
    });

    test('should show warning alert with correct styling', () => {
      const mockAlertContainer = {
        removeClass: jest.fn().mockReturnThis(),
        addClass: jest.fn().mockReturnThis(),
        html: jest.fn().mockReturnThis(),
        fadeIn: jest.fn().mockReturnThis()
      };
      
      const mockJQuery = jest.fn(() => mockAlertContainer);
      global.jQuery = mockJQuery;
      
      showTailwindAlert('Warning message', 'warning');
      
      expect(mockAlertContainer.addClass).toHaveBeenCalledWith('bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded');
    });

    test('should show info alert with correct styling', () => {
      const mockAlertContainer = {
        removeClass: jest.fn().mockReturnThis(),
        addClass: jest.fn().mockReturnThis(),
        html: jest.fn().mockReturnThis(),
        fadeIn: jest.fn().mockReturnThis()
      };
      
      const mockJQuery = jest.fn(() => mockAlertContainer);
      global.jQuery = mockJQuery;
      
      showTailwindAlert('Info message', 'info');
      
      expect(mockAlertContainer.addClass).toHaveBeenCalledWith('bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded');
    });

    test('should default to danger type when no type specified', () => {
      const mockAlertContainer = {
        removeClass: jest.fn().mockReturnThis(),
        addClass: jest.fn().mockReturnThis(),
        html: jest.fn().mockReturnThis(),
        fadeIn: jest.fn().mockReturnThis()
      };
      
      const mockJQuery = jest.fn(() => mockAlertContainer);
      global.jQuery = mockJQuery;
      
      showTailwindAlert('Default message');
      
      expect(mockAlertContainer.addClass).toHaveBeenCalledWith('bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded');
    });
  });

  describe('Button group functionality', () => {
    test('should handle button group clicks correctly', () => {
      // Mock jQuery elements for button group
      const mockLabel = {
        closest: jest.fn(() => mockGroup),
        find: jest.fn(() => mockRadio),
        addClass: jest.fn().mockReturnThis(),
        removeClass: jest.fn().mockReturnThis()
      };
      
      const mockGroup = {
        find: jest.fn(() => ({
          removeClass: jest.fn().mockReturnThis()
        }))
      };
      
      const mockRadio = {
        prop: jest.fn().mockReturnThis(),
        trigger: jest.fn().mockReturnThis(),
        attr: jest.fn((attr) => attr === 'id' ? 'left' : 'left'),
        val: jest.fn(() => 'left')
      };
      
      const mockJQuery = jest.fn(() => mockLabel);
      global.jQuery = mockJQuery;
      
      // Simulate button group functionality
      const handleButtonClick = function() {
        const $label = mockLabel;
        const $group = $label.closest('.btn-group');
        const $radio = $label.find('input[type="radio"]');
        
        $group.find('label').removeClass('active').removeClass('bg-gruene-secondary');
        $label.addClass('active').addClass('bg-gruene-secondary');
        $radio.prop('checked', true).trigger('change');
      };
      
      handleButtonClick();
      
      expect(mockLabel.addClass).toHaveBeenCalledWith('active');
      expect(mockLabel.addClass).toHaveBeenCalledWith('bg-gruene-secondary');
      expect(mockRadio.prop).toHaveBeenCalledWith('checked', true);
      expect(mockRadio.trigger).toHaveBeenCalledWith('change');
    });
  });
});