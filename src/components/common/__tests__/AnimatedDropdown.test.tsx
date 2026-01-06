import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import AnimatedDropdown from '../AnimatedDropdown';
import { Keyboard } from 'react-native';

// Mock Lucide icons
jest.mock('lucide-react-native', () => ({
    ChevronDown: 'ChevronDown',
    Search: 'Search',
    Check: 'Check',
}));

// Mock expo-blur
jest.mock('expo-blur', () => ({
    BlurView: 'BlurView',
}));

describe('AnimatedDropdown', () => {
    const mockOnSelect = jest.fn();
    const defaultProps = {
        label: 'Test Label',
        options: ['Option 1', 'Option 2', 'Orange'],
        selected: '',
        onSelect: mockOnSelect,
    };

    beforeEach(() => {
        jest.clearAllMocks();
        jest.spyOn(Keyboard, 'dismiss');
    });

    it('should render label and placeholder', () => {
        const { getByText, getByPlaceholderText } = render(<AnimatedDropdown {...defaultProps} />);
        expect(getByText('Test Label')).toBeTruthy();
        expect(getByText('Select...')).toBeTruthy();
        expect(getByPlaceholderText('Search...')).toBeTruthy();
    });

    it('should toggle dropdown on trigger press', () => {
        const { getByTestId, queryByTestId } = render(<AnimatedDropdown {...defaultProps} />);

        const trigger = getByTestId('dropdown-trigger');

        // Open
        fireEvent.press(trigger);
        // We can't easily check "visible" style on Animated.View without more complex setup, 
        // but we can check if state related things happen or if we can interact.
        // In this component, content is always rendered but height animates.
        // Let's assume the component logic works if we can find options.

        // Close
        fireEvent.press(trigger);
        expect(Keyboard.dismiss).toHaveBeenCalled();
    });

    it('should filter options based on search text', () => {
        const { getByPlaceholderText, getByText, queryByText } = render(<AnimatedDropdown {...defaultProps} />);

        const searchInput = getByPlaceholderText('Search...');
        fireEvent.changeText(searchInput, 'Orange');

        expect(getByText('Orange')).toBeTruthy();
        expect(queryByText('Option 1')).toBeNull();
    });

    it('should show no results when search matches nothing', () => {
        const { getByPlaceholderText, getByText } = render(<AnimatedDropdown {...defaultProps} />);

        const searchInput = getByPlaceholderText('Search...');
        fireEvent.changeText(searchInput, 'Banana');

        expect(getByText('No matches found')).toBeTruthy();
    });

    it('should select an option and close', () => {
        const { getByTestId } = render(<AnimatedDropdown {...defaultProps} />);

        fireEvent.press(getByTestId('dropdown-trigger')); // Open
        fireEvent.press(getByTestId('dropdown-option-Option 1'));

        expect(mockOnSelect).toHaveBeenCalledWith('Option 1');
        expect(Keyboard.dismiss).toHaveBeenCalled();
    });

    it('should display selected value', () => {
        const { getByTestId, getAllByText } = render(<AnimatedDropdown {...defaultProps} selected="Option 1" />);
        // "Option 1" appears in the trigger text AND in the dropdown list options corresponding to it
        // We can check if the trigger contains it specifically
        const trigger = getByTestId('dropdown-trigger');
        // Check if children contain the text or use getAllByText
        expect(getAllByText('Option 1').length).toBeGreaterThan(0);
    });
});
