import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Modal,
  ScrollView,
  Dimensions,
  Alert,
  RefreshControl,
  StatusBar,
} from 'react-native';
import { Audio } from 'expo-av';
import AsyncStorage from '@react-native-async-storage/async-storage';
import orderPollingService from '../services/orderPollingService';

export default function KitchenDisplayScreen({ navigation }) {
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [orientation, setOrientation] = useState('portrait');
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);
  const soundRef = useRef(null);

  useEffect(() => {
    loadOrders();
    checkOrientation();
    startPolling();

    const dimensionListener = Dimensions.addEventListener('change', checkOrientation);

    return () => {
      dimensionListener?.remove();
      orderPollingService.stopPolling();
      if (soundRef.current) {
        soundRef.current.unloadAsync();
      }
    };
  }, []);

  const checkOrientation = () => {
    const { width, height } = Dimensions.get('window');
    setOrientation(width > height ? 'landscape' : 'portrait');
  };

  const loadOrders = async () => {
    try {
      const storedOrders = await AsyncStorage.getItem('orders');
      if (storedOrders) {
        setOrders(JSON.parse(storedOrders));
      }
    } catch (error) {
      console.error('Error loading orders:', error);
    }
  };

  const saveOrders = async (newOrders) => {
    try {
      await AsyncStorage.setItem('orders', JSON.stringify(newOrders));
    } catch (error) {
      console.error('Error saving orders:', error);
    }
  };

  const playNotificationSound = async () => {
    try {
      const { sound } = await Audio.Sound.createAsync(
        { uri: 'https://actions.google.com/sounds/v1/alarms/beep_short.ogg' },
        { shouldPlay: true, volume: 1.0 }
      );
      soundRef.current = sound;
    } catch (error) {
      console.error('Error playing sound:', error);
    }
  };

  const startPolling = () => {
    orderPollingService.startPolling(handleNewOrders, 5000);
  };

  const handleNewOrders = (newOrdersFromApi) => {
    if (!newOrdersFromApi || newOrdersFromApi.length === 0) return;

    playNotificationSound();

    setOrders(prevOrders => {
      const existingIds = new Set(prevOrders.map(o => o.id));
      const trulyNewOrders = newOrdersFromApi.filter(o => !existingIds.has(o.id));

      if (trulyNewOrders.length === 0) return prevOrders;

      const updatedOrders = [...trulyNewOrders, ...prevOrders];
      saveOrders(updatedOrders);
      return updatedOrders;
    });

    setLastUpdate(new Date().toLocaleTimeString('he-IL', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }));
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await orderPollingService.refreshOrders(handleNewOrders);
    setRefreshing(false);
  };

  const updateOrderStatus = (orderId, newStatus) => {
    const updatedOrders = orders.map((order) =>
      order.id === orderId ? { ...order, status: newStatus } : order
    );
    setOrders(updatedOrders);
    saveOrders(updatedOrders);

    if (selectedOrder?.id === orderId) {
      setSelectedOrder({ ...selectedOrder, status: newStatus });
    }
  };

  const completeOrder = (orderId) => {
    Alert.alert(
      '✅ אישור השלמה',
      'האם אתה בטוח שההזמנה הושלמה?',
      [
        { text: 'ביטול', style: 'cancel' },
        {
          text: 'אישור',
          onPress: () => {
            const updatedOrders = orders.filter((order) => order.id !== orderId);
            setOrders(updatedOrders);
            saveOrders(updatedOrders);
            setModalVisible(false);
            setSelectedOrder(null);
          },
        },
      ]
    );
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'new':
        return '#FF5252';
      case 'preparing':
        return '#FFC107';
      case 'ready':
        return '#4CAF50';
      default:
        return '#9E9E9E';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'new':
        return 'חדשה';
      case 'preparing':
        return 'בהכנה';
      case 'ready':
        return 'מוכנה';
      default:
        return '';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'new':
        return '🆕';
      case 'preparing':
        return '👨‍🍳';
      case 'ready':
        return '✅';
      default:
        return '📋';
    }
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' });
  };

  const renderOrderCard = ({ item }) => (
    <TouchableOpacity
      style={[styles.orderCard, { backgroundColor: getStatusColor(item.status) }]}
      onPress={() => {
        setSelectedOrder(item);
        setModalVisible(true);
      }}
      activeOpacity={0.9}
    >
      <View style={styles.orderHeader}>
        <View style={styles.orderNumberContainer}>
          <Text style={styles.orderNumberLabel}>הזמנה</Text>
          <Text style={styles.orderNumber}>#{item.orderNumber}</Text>
        </View>
        <Text style={styles.statusIcon}>{getStatusIcon(item.status)}</Text>
      </View>

      <View style={styles.orderDivider} />

      <View style={styles.orderInfo}>
        <View style={styles.infoRow}>
          <Text style={styles.infoIcon}>🕒</Text>
          <Text style={styles.infoText}>{formatTime(item.createdAt)}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoIcon}>🏪</Text>
          <Text style={styles.infoText}>{item.storeCode}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoIcon}>💳</Text>
          <Text style={styles.infoText}>{item.posCode}</Text>
        </View>
      </View>

      <View style={styles.orderDivider} />

      <View style={styles.orderFooter}>
        <View style={styles.itemsCountBadge}>
          <Text style={styles.itemsCountText}>
            {item.items?.length || 0} פריטים
          </Text>
        </View>
        <Text style={styles.totalAmount}>
          ₪{item.totalAmount?.toFixed(2) || '0.00'}
        </Text>
      </View>

      {item.remarks && (
        <View style={styles.remarksContainer}>
          <Text style={styles.remarksIcon}>📝</Text>
          <Text style={styles.remarksText} numberOfLines={2}>
            {item.remarks}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );

  const numColumns = orientation === 'landscape' ? 3 : 2;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#4CAF50" />

      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backIcon}>←</Text>
          <Text style={styles.backText}>חזור</Text>
        </TouchableOpacity>

        <Text style={styles.headerTitle}>👨‍🍳 תצוגת מטבח</Text>
        <View style={styles.headerStats}>
          <View style={styles.statBadge}>
            <Text style={styles.statNumber}>{orders.length}</Text>
            <Text style={styles.statLabel}>הזמנות פעילות</Text>
          </View>
          {lastUpdate && (
            <View style={styles.lastUpdateBadge}>
              <Text style={styles.liveIndicator}>🔴</Text>
              <Text style={styles.lastUpdateText}>עדכון: {lastUpdate}</Text>
            </View>
          )}
        </View>
      </View>

      {orders.length === 0 ? (
        <ScrollView
          contentContainerStyle={styles.emptyContainer}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          <Text style={styles.emptyIcon}>🍽️</Text>
          <Text style={styles.emptyText}>אין הזמנות ממתינות</Text>
          <Text style={styles.emptySubtext}>
            הזמנות חדשות יופיעו כאן אוטומטית{'\n'}
            (בודק כל 5 שניות)
          </Text>
          <TouchableOpacity style={styles.refreshButton} onPress={onRefresh}>
            <Text style={styles.refreshButtonIcon}>🔄</Text>
            <Text style={styles.refreshButtonText}>רענן עכשיו</Text>
          </TouchableOpacity>
        </ScrollView>
      ) : (
        <FlatList
          data={orders}
          renderItem={renderOrderCard}
          keyExtractor={(item) => item.id.toString()}
          numColumns={numColumns}
          key={numColumns}
          contentContainerStyle={styles.listContainer}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        />
      )}

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {selectedOrder && (
              <ScrollView showsVerticalScrollIndicator={false}>
                <View style={[styles.modalHeader, { backgroundColor: getStatusColor(selectedOrder.status) }]}>
                  <View style={styles.modalHeaderContent}>
                    <View>
                      <Text style={styles.modalTitle}>הזמנה #{selectedOrder.orderNumber}</Text>
                      <Text style={styles.modalSubtitle}>{getStatusText(selectedOrder.status)}</Text>
                    </View>
                    <TouchableOpacity
                      style={styles.closeButton}
                      onPress={() => setModalVisible(false)}
                    >
                      <Text style={styles.closeButtonText}>✕</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.modalSection}>
                  <View style={styles.infoGrid}>
                    <View style={styles.infoCard}>
                      <Text style={styles.infoCardIcon}>🕒</Text>
                      <Text style={styles.infoCardLabel}>שעה</Text>
                      <Text style={styles.infoCardValue}>{formatTime(selectedOrder.createdAt)}</Text>
                    </View>
                    <View style={styles.infoCard}>
                      <Text style={styles.infoCardIcon}>🏪</Text>
                      <Text style={styles.infoCardLabel}>סניף</Text>
                      <Text style={styles.infoCardValue}>{selectedOrder.storeCode}</Text>
                    </View>
                    <View style={styles.infoCard}>
                      <Text style={styles.infoCardIcon}>💳</Text>
                      <Text style={styles.infoCardLabel}>קופה</Text>
                      <Text style={styles.infoCardValue}>{selectedOrder.posCode}</Text>
                    </View>
                  </View>
                </View>

                {selectedOrder.remarks && (
                  <View style={styles.modalSection}>
                    <View style={styles.remarksBox}>
                      <Text style={styles.remarksBoxIcon}>📝</Text>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.remarksBoxTitle}>הערות להזמנה:</Text>
                        <Text style={styles.remarksBoxText}>{selectedOrder.remarks}</Text>
                      </View>
                    </View>
                  </View>
                )}

                <View style={styles.modalSection}>
                  <Text style={styles.sectionTitle}>🍽️ פריטים בהזמנה</Text>
                  {selectedOrder.items?.map((item, index) => (
                    <View key={index} style={styles.itemCard}>
                      <View style={styles.itemHeader}>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.itemName}>{item.itemName}</Text>
                          <Text style={styles.itemCode}>{item.itemCode}</Text>
                        </View>
                        <View style={styles.itemQuantityBadge}>
                          <Text style={styles.itemQuantity}>×{item.quantity}</Text>
                        </View>
                      </View>

                      {item.itemRemark && (
                        <View style={styles.itemRemarkContainer}>
                          <Text style={styles.itemRemarkIcon}>💬</Text>
                          <Text style={styles.itemRemarkText}>{item.itemRemark}</Text>
                        </View>
                      )}

                      {item.modifiers && item.modifiers.length > 0 && (
                        <View style={styles.modifiersContainer}>
                          <Text style={styles.modifiersTitle}>תוספות:</Text>
                          {item.modifiers.map((mod, modIndex) => (
                            <Text key={modIndex} style={styles.modifierText}>
                              • {mod.itemModifierName} ×{mod.quantity}
                            </Text>
                          ))}
                        </View>
                      )}

                      <View style={styles.itemFooter}>
                        <Text style={styles.itemPrice}>₪{item.totalAmount?.toFixed(2)}</Text>
                      </View>
                    </View>
                  ))}
                </View>

                <View style={styles.modalSection}>
                  <View style={styles.totalContainer}>
                    <Text style={styles.totalLabel}>סה"כ לתשלום:</Text>
                    <Text style={styles.totalAmount}>₪{selectedOrder.totalAmount?.toFixed(2)}</Text>
                  </View>
                </View>

                <View style={styles.modalSection}>
                  {selectedOrder.status === 'new' && (
                    <TouchableOpacity
                      style={[styles.actionButton, styles.preparingButton]}
                      onPress={() => updateOrderStatus(selectedOrder.id, 'preparing')}
                    >
                      <Text style={styles.actionButtonIcon}>👨‍🍳</Text>
                      <Text style={styles.actionButtonText}>התחל הכנה</Text>
                    </TouchableOpacity>
                  )}

                  {selectedOrder.status === 'preparing' && (
                    <TouchableOpacity
                      style={[styles.actionButton, styles.readyButton]}
                      onPress={() => updateOrderStatus(selectedOrder.id, 'ready')}
                    >
                      <Text style={styles.actionButtonIcon}>✅</Text>
                      <Text style={styles.actionButtonText}>מוכן לאיסוף</Text>
                    </TouchableOpacity>
                  )}

                  {selectedOrder.status === 'ready' && (
                    <TouchableOpacity
                      style={[styles.actionButton, styles.completeButton]}
                      onPress={() => completeOrder(selectedOrder.id)}
                    >
                      <Text style={styles.actionButtonIcon}>🎉</Text>
                      <Text style={styles.actionButtonText}>הושלמה</Text>
                    </TouchableOpacity>
                  )}
                </View>

                <View style={{ height: 30 }} />
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fa',
  },
  header: {
    backgroundColor: '#4CAF50',
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  backButton: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    marginBottom: 16,
  },
  backIcon: {
    fontSize: 24,
    color: 'white',
    marginRight: 8,
  },
  backText: {
    fontSize: 16,
    color: 'white',
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 12,
  },
  headerStats: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 12,
  },
  statBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 8,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  statLabel: {
    fontSize: 14,
    color: 'white',
  },
  lastUpdateBadge: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 6,
  },
  liveIndicator: {
    fontSize: 12,
  },
  lastUpdateText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  listContainer: {
    padding: 12,
  },
  orderCard: {
    flex: 1,
    margin: 6,
    padding: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
    minHeight: 180,
  },
  orderHeader: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  orderNumberContainer: {
    gap: 4,
  },
  orderNumberLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '600',
  },
  orderNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  statusIcon: {
    fontSize: 32,
  },
  orderDivider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    marginVertical: 12,
  },
  orderInfo: {
    gap: 8,
  },
  infoRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 8,
  },
  infoIcon: {
    fontSize: 16,
  },
  infoText: {
    fontSize: 14,
    color: 'white',
    fontWeight: '500',
  },
  orderFooter: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
  },
  itemsCountBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  itemsCountText: {
    fontSize: 14,
    color: 'white',
    fontWeight: '600',
  },
  totalAmount: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  remarksContainer: {
    marginTop: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    padding: 12,
    borderRadius: 8,
    flexDirection: 'row-reverse',
    gap: 8,
  },
  remarksIcon: {
    fontSize: 16,
  },
  remarksText: {
    flex: 1,
    fontSize: 13,
    color: 'white',
    lineHeight: 18,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyIcon: {
    fontSize: 80,
    marginBottom: 20,
  },
  emptyText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#666',
    marginBottom: 12,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 30,
  },
  refreshButton: {
    backgroundColor: '#4CAF50',
    flexDirection: 'row-reverse',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 16,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  refreshButtonIcon: {
    fontSize: 24,
  },
  refreshButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    maxHeight: '90%',
    elevation: 8,
  },
  modalHeader: {
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 24,
  },
  modalHeaderContent: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 24,
    color: 'white',
    fontWeight: 'bold',
  },
  modalSection: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  infoGrid: {
    flexDirection: 'row-reverse',
    gap: 12,
  },
  infoCard: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    gap: 8,
  },
  infoCardIcon: {
    fontSize: 28,
  },
  infoCardLabel: {
    fontSize: 12,
    color: '#666',
  },
  infoCardValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  remarksBox: {
    backgroundColor: '#FFF3E0',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#FFB300',
    flexDirection: 'row-reverse',
    gap: 12,
  },
  remarksBoxIcon: {
    fontSize: 24,
  },
  remarksBoxTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#E65100',
    marginBottom: 6,
  },
  remarksBoxText: {
    fontSize: 15,
    color: '#F57C00',
    lineHeight: 22,
  },
  itemCard: {
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderRightWidth: 4,
    borderRightColor: '#2196F3',
  },
  itemHeader: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  itemName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  itemCode: {
    fontSize: 13,
    color: '#999',
  },
  itemQuantityBadge: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  itemQuantity: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
  },
  itemRemarkContainer: {
    flexDirection: 'row-reverse',
    gap: 8,
    backgroundColor: '#FFF3E0',
    padding: 10,
    borderRadius: 8,
    marginTop: 8,
  },
  itemRemarkIcon: {
    fontSize: 16,
  },
  itemRemarkText: {
    flex: 1,
    fontSize: 14,
    color: '#F57C00',
  },
  modifiersContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#dee2e6',
  },
  modifiersTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#666',
    marginBottom: 8,
  },
  modifierText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  itemFooter: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#dee2e6',
  },
  itemPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4CAF50',
    textAlign: 'left',
  },
  totalContainer: {
    backgroundColor: '#4CAF50',
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderRadius: 12,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
  },
  totalAmount: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
  },
  actionButton: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    borderRadius: 16,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  preparingButton: {
    backgroundColor: '#FFC107',
  },
  readyButton: {
    backgroundColor: '#4CAF50',
  },
  completeButton: {
    backgroundColor: '#2196F3',
  },
  actionButtonIcon: {
    fontSize: 28,
  },
  actionButtonText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
});
