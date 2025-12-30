import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Platform } from 'react-native';

interface TimePickerViewProps {
    selectedDate: Date;
    onTimeChange: (date: Date) => void;
}

const ITEM_HEIGHT = 50;
const VISIBLE_ITEMS = 5; // Should be odd to have a center
const CENTER_INDEX = Math.floor(VISIBLE_ITEMS / 2);

export default function TimePickerView({ selectedDate, onTimeChange }: TimePickerViewProps) {
    const hours = selectedDate.getHours();
    const minutes = selectedDate.getMinutes();

    const isPM = hours >= 12;
    const displayHour = hours % 12 || 12; // Convert 0 to 12
    const displayMinute = minutes.toString().padStart(2, '0');

    // Generate arrays
    // For hours: 1 to 12
    const hoursData = Array.from({ length: 12 }, (_, i) => i + 1);
    // For minutes: 0 to 59
    const minutesData = Array.from({ length: 60 }, (_, i) => i);

    const toggleAmPm = (period: 'AM' | 'PM') => {
        if ((period === 'AM' && isPM) || (period === 'PM' && !isPM)) {
            const newDate = new Date(selectedDate);
            const currentHours = newDate.getHours();
            newDate.setHours(currentHours + (period === 'PM' ? 12 : -12));
            onTimeChange(newDate);
        }
    };

    const handleHourSelect = (h: number) => {
        let newHour24 = h;
        if (isPM && h !== 12) newHour24 += 12;
        if (!isPM && h === 12) newHour24 = 0;

        const newDate = new Date(selectedDate);
        newDate.setHours(newHour24);
        onTimeChange(newDate);
    };

    const handleMinuteSelect = (m: number) => {
        const newDate = new Date(selectedDate);
        newDate.setMinutes(m);
        onTimeChange(newDate);
    };

    // Scroll to initial positions
    const flatListRefHour = useRef<FlatList>(null);
    const flatListRefMinute = useRef<FlatList>(null);

    useEffect(() => {
        // Initial scroll to position
        // We use a small timeout to ensure layout is ready
        setTimeout(() => {
            const hourIndex = hoursData.indexOf(displayHour);
            if (hourIndex !== -1 && flatListRefHour.current) {
                flatListRefHour.current.scrollToIndex({ index: hourIndex, animated: false, viewPosition: 0.5 });
            }

            const minuteIndex = minutesData.indexOf(minutes);
            if (minuteIndex !== -1 && flatListRefMinute.current) {
                flatListRefMinute.current.scrollToIndex({ index: minuteIndex, animated: false, viewPosition: 0.5 });
            }
        }, 100);
    }, []); // Run once on mount. Warning: if selectedDate changes externally, we might want to sync, but for valid UX usually we drive it.

    const renderItem = (item: number, isSelected: boolean, onPress: () => void) => (
        <TouchableOpacity
            style={[styles.listItem, { height: ITEM_HEIGHT }]}
            onPress={onPress}
        >
            <Text style={[styles.listItemText, isSelected && styles.selectedListItemText]}>
                {item.toString().padStart(2, '0')}
            </Text>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            {/* Digital Display */}
            <View style={styles.displayContainer}>
                <View style={[styles.timeBox]}>
                    <Text style={styles.timeText}>{displayHour}</Text>
                    <Text style={styles.colon}>:</Text>
                    <Text style={styles.timeText}>{displayMinute}</Text>
                </View>
                <View style={styles.amPmContainer}>
                    <TouchableOpacity
                        style={[styles.amPmButton, !isPM && styles.activeAmPm]}
                        onPress={() => toggleAmPm('AM')}
                    >
                        <Text style={[styles.amPmText, !isPM && styles.activeAmPmText]}>AM</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.amPmButton, isPM && styles.activeAmPm]}
                        onPress={() => toggleAmPm('PM')}
                    >
                        <Text style={[styles.amPmText, isPM && styles.activeAmPmText]}>PM</Text>
                    </TouchableOpacity>
                </View>
            </View>

            <View style={styles.selectionRow}>
                {/* Hours List */}
                <View style={styles.listWrapper}>
                    <Text style={styles.listLabel}>Hour</Text>
                    <View style={styles.listContainer}>
                        <View style={styles.selectionOverlay} pointerEvents="none" />
                        <FlatList
                            ref={flatListRefHour}
                            data={hoursData}
                            keyExtractor={(item) => item.toString()}
                            renderItem={({ item }) => renderItem(item, item === displayHour, () => handleHourSelect(item))}
                            showsVerticalScrollIndicator={false}
                            snapToInterval={ITEM_HEIGHT}
                            decelerationRate="fast"
                            contentContainerStyle={{
                                paddingVertical: ITEM_HEIGHT * CENTER_INDEX
                            }}
                            getItemLayout={(data, index) => (
                                { length: ITEM_HEIGHT, offset: ITEM_HEIGHT * index, index }
                            )}
                            onMomentumScrollEnd={(ev) => {
                                const index = Math.round(ev.nativeEvent.contentOffset.y / ITEM_HEIGHT);
                                if (index >= 0 && index < hoursData.length) {
                                    handleHourSelect(hoursData[index]);
                                }
                            }}
                        />
                    </View>
                </View>

                {/* Minutes List */}
                <View style={styles.listWrapper}>
                    <Text style={styles.listLabel}>Minute</Text>
                    <View style={styles.listContainer}>
                        <View style={styles.selectionOverlay} pointerEvents="none" />
                        <FlatList
                            ref={flatListRefMinute}
                            data={minutesData}
                            keyExtractor={(item) => item.toString()}
                            renderItem={({ item }) => renderItem(item, item === minutes, () => handleMinuteSelect(item))}
                            showsVerticalScrollIndicator={false}
                            snapToInterval={ITEM_HEIGHT}
                            decelerationRate="fast"
                            contentContainerStyle={{
                                paddingVertical: ITEM_HEIGHT * CENTER_INDEX
                            }}
                            getItemLayout={(data, index) => (
                                { length: ITEM_HEIGHT, offset: ITEM_HEIGHT * index, index }
                            )}
                            onMomentumScrollEnd={(ev) => {
                                const index = Math.round(ev.nativeEvent.contentOffset.y / ITEM_HEIGHT);
                                if (index >= 0 && index < minutesData.length) {
                                    handleMinuteSelect(minutesData[index]);
                                }
                            }}
                        />
                    </View>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        width: '100%',
        paddingVertical: 10,
        height: '100%',
    },
    displayContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
        gap: 16,
    },
    timeBox: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    timeText: {
        fontSize: 48,
        fontWeight: 'bold',
        color: '#FFFFFF',
        fontVariant: ['tabular-nums'],
    },
    colon: {
        fontSize: 48,
        fontWeight: 'bold',
        color: '#FFFFFF',
        marginHorizontal: 4,
        marginBottom: 8,
    },
    amPmContainer: {
        backgroundColor: '#2C2C2E',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#3A3A3C',
        overflow: 'hidden',
    },
    amPmButton: {
        paddingVertical: 8,
        paddingHorizontal: 12,
    },
    activeAmPm: {
        backgroundColor: '#E5D0AC',
    },
    amPmText: {
        color: '#A1A1AA',
        fontSize: 14,
        fontWeight: 'bold',
    },
    activeAmPmText: {
        color: '#1C1C1E',
    },
    selectionRow: {
        flexDirection: 'row',
        flex: 1, // Take remaining height
        gap: 16,
    },
    listWrapper: {
        flex: 1,
        alignItems: 'center',
    },
    listContainer: {
        flex: 1,
        width: '100%',
        backgroundColor: '#2C2C2E',
        borderRadius: 12,
        overflow: 'hidden',
        height: ITEM_HEIGHT * VISIBLE_ITEMS, // 5 items visible
    },
    listLabel: {
        color: '#A1A1AA',
        fontSize: 12,
        marginBottom: 8,
        fontWeight: '600',
    },
    selectionOverlay: {
        position: 'absolute',
        top: ITEM_HEIGHT * CENTER_INDEX,
        left: 0,
        right: 0,
        height: ITEM_HEIGHT,
        backgroundColor: 'rgba(229, 208, 172, 0.1)', // #E5D0AC with low opacity
        borderTopWidth: 1,
        borderBottomWidth: 1,
        borderColor: '#E5D0AC',
        zIndex: 10,
    },
    listItem: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    listItemText: {
        color: '#888',
        fontSize: 18,
    },
    selectedListItemText: {
        color: '#E5D0AC',
        fontSize: 22,
        fontWeight: 'bold',
    },
});
