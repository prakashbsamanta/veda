import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';

interface CalendarViewProps {
    selectedDate: Date;
    onDateSelect: (date: Date) => void;
    minDate?: Date;
}

const DAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export default function CalendarView({ selectedDate, onDateSelect, minDate }: CalendarViewProps) {
    const [currentMonth, setCurrentMonth] = useState(new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1));

    const generateDays = useMemo(() => {
        const year = currentMonth.getFullYear();
        const month = currentMonth.getMonth();

        const firstDayOfMonth = new Date(year, month, 1);
        const daysInMonth = new Date(year, month + 1, 0).getDate();

        const startingDayIndex = firstDayOfMonth.getDay(); // 0 for Sunday

        const daysArray: (number | null)[] = [];

        // Fill previous month empty slots
        for (let i = 0; i < startingDayIndex; i++) {
            daysArray.push(null);
        }

        // Fill current month days
        for (let i = 1; i <= daysInMonth; i++) {
            daysArray.push(i);
        }

        return daysArray;
    }, [currentMonth]);

    const changeMonth = (increment: number) => {
        const newMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + increment, 1);
        setCurrentMonth(newMonth);
    };

    const handleDayPress = (day: number) => {
        const newDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
        // Preserve time from selectedDate logic could happen here, but for "Date Picker" usually reset or keep? 
        // Let's preserve the time of the *currently selected* date to avoid resetting to 00:00
        newDate.setHours(selectedDate.getHours());
        newDate.setMinutes(selectedDate.getMinutes());
        newDate.setSeconds(selectedDate.getSeconds());
        onDateSelect(newDate);
    };

    const isSelected = (day: number) => {
        return selectedDate.getDate() === day &&
            selectedDate.getMonth() === currentMonth.getMonth() &&
            selectedDate.getFullYear() === currentMonth.getFullYear();
    };

    const isToday = (day: number) => {
        const today = new Date();
        return today.getDate() === day &&
            today.getMonth() === currentMonth.getMonth() &&
            today.getFullYear() === currentMonth.getFullYear();
    };

    const isDisabled = (day: number) => {
        if (!minDate) return false;
        const dateToCheck = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
        // Reset time to midnight for comparison to allow selecting "today" even if time has passed
        const todayMidnight = new Date(minDate).setHours(0, 0, 0, 0);
        return dateToCheck.setHours(0, 0, 0, 0) < todayMidnight;
    };

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => changeMonth(-1)} style={styles.navButton}>
                    <ChevronLeft color="#E5D0AC" size={24} />
                </TouchableOpacity>
                <Text style={styles.monthTitle}>
                    {MONTHS[currentMonth.getMonth()]} {currentMonth.getFullYear()}
                </Text>
                <TouchableOpacity onPress={() => changeMonth(1)} style={styles.navButton}>
                    <ChevronRight color="#E5D0AC" size={24} />
                </TouchableOpacity>
            </View>

            {/* Days Header */}
            <View style={styles.daysHeader}>
                {DAYS.map(day => (
                    <Text key={day} style={styles.dayLabel}>{day}</Text>
                ))}
            </View>

            {/* Grid */}
            <View style={styles.grid}>
                {generateDays.map((day, index) => {
                    if (day === null) {
                        return <View key={`empty-${index}`} style={styles.dayCell} />;
                    }

                    const selected = isSelected(day);
                    const today = isToday(day);
                    const disabled = isDisabled(day);

                    return (
                        <TouchableOpacity
                            key={day}
                            style={[
                                styles.dayCell,
                                selected && styles.selectedDayCell,
                                today && !selected && styles.todayCell
                            ]}
                            onPress={() => !disabled && handleDayPress(day)}
                            disabled={disabled}
                        >
                            <Text style={[
                                styles.dayText,
                                selected && styles.selectedDayText,
                                today && !selected && styles.todayText,
                                disabled && styles.disabledDayText
                            ]}>
                                {day}
                            </Text>
                        </TouchableOpacity>
                    );
                })}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        width: '100%',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    monthTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#FFFFFF',
    },
    navButton: {
        padding: 8,
    },
    daysHeader: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginBottom: 10,
    },
    dayLabel: {
        color: '#A1A1AA',
        fontSize: 14,
        fontWeight: '600',
        width: 40,
        textAlign: 'center',
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'flex-start', // Grid alignment
    },
    dayCell: {
        width: '14.28%', // 100% / 7
        aspectRatio: 1,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 4,
        borderRadius: 20,
    },
    selectedDayCell: {
        backgroundColor: '#E5D0AC',
    },
    todayCell: {
        borderWidth: 1,
        borderColor: '#E5D0AC',
    },
    dayText: {
        color: '#FFFFFF',
        fontSize: 16,
    },
    selectedDayText: {
        color: '#1C1C1E',
        fontWeight: 'bold',
    },
    todayText: {
        color: '#E5D0AC',
        fontWeight: 'bold',
    },
    disabledDayText: {
        color: '#3A3A3C',
    }
});
