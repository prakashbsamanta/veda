import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import CustomAlertModal from '../CustomAlertModal';

describe('CustomAlertModal', () => {
    const mockOnClose = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should render correctly with title and message', () => {
        const { getByText } = render(
            <CustomAlertModal
                visible={true}
                title="Test Title"
                message="Test Message"
                onClose={mockOnClose}
            />
        );

        expect(getByText('Test Title')).toBeTruthy();
        expect(getByText('Test Message')).toBeTruthy();
    });

    it('should show default OK button if no buttons provided', () => {
        const { getByText } = render(
            <CustomAlertModal
                visible={true}
                title="Test Title"
                onClose={mockOnClose}
            />
        );

        const okBtn = getByText('OK');
        expect(okBtn).toBeTruthy();

        fireEvent.press(okBtn);
        expect(mockOnClose).toHaveBeenCalled();
    });

    it('should render custom buttons and handle presses', () => {
        const mockOnPress = jest.fn();
        const buttons = [
            { text: 'Cancel', style: 'cancel' as const, onPress: mockOnClose },
            { text: 'Delete', style: 'destructive' as const, onPress: mockOnPress }
        ];

        const { getByText } = render(
            <CustomAlertModal
                visible={true}
                title="Confirm"
                buttons={buttons}
                onClose={mockOnClose}
            />
        );

        expect(getByText('CANCEL')).toBeTruthy();
        expect(getByText('DELETE')).toBeTruthy();

        fireEvent.press(getByText('DELETE'));
        expect(mockOnPress).toHaveBeenCalled();
        expect(mockOnClose).not.toHaveBeenCalled(); // Should only call its own handler
    });

    it('should not render when visible is false', () => {
        const { queryByText } = render(
            <CustomAlertModal
                visible={false}
                title="Hidden"
                onClose={mockOnClose}
            />
        );

        expect(queryByText('Hidden')).toBeNull();
    });

    it('should call onClose fallback if button has no onPress', () => {
        const buttons = [{ text: 'Close' }]; // No onPress
        const { getByText } = render(
            <CustomAlertModal
                visible={true}
                title="Info"
                buttons={buttons as any}
                onClose={mockOnClose}
            />
        );

        fireEvent.press(getByText('CLOSE'));
        expect(mockOnClose).toHaveBeenCalled();
    });
});
