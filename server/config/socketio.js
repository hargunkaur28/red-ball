// Real-time Socket.IO event handlers for all operational features
module.exports = function setupSocketIO(io) {
  io.on('connection', (socket) => {
    console.log(`🔌 Client connected: ${socket.id}`);

    // === PAYMENT EVENTS ===
    socket.on('payment:initiated', (data) => {
      io.emit('payment:status', {
        orderId: data.orderId,
        status: 'initiated',
        timestamp: new Date(),
      });
    });

    socket.on('payment:processing', (data) => {
      io.emit('payment:status', {
        orderId: data.orderId,
        status: 'processing',
        timestamp: new Date(),
      });
    });

    // === SLOT BOOKING EVENTS ===
    socket.on('slot:book', (data) => {
      io.emit('slot:availability-updated', {
        slotId: data.slotId,
        currentBookings: data.currentBookings,
        status: data.status,
        timestamp: new Date(),
      });
    });

    socket.on('slot:occupancy-change', (data) => {
      io.emit('ground:occupancy-updated', {
        groundId: data.groundId,
        occupancy: data.occupancy,
        maxCapacity: data.maxCapacity,
        percentageFilled: (data.occupancy / data.maxCapacity) * 100,
        timestamp: new Date(),
      });
    });

    // === OPERATIONS EVENTS ===
    socket.on('operation:event-started', (data) => {
      io.emit('operation:status', {
        eventId: data.eventId,
        status: 'ongoing',
        ground: data.ground,
        message: `Event started at ${data.ground}`,
        timestamp: new Date(),
      });
    });

    socket.on('operation:event-completed', (data) => {
      io.emit('operation:status', {
        eventId: data.eventId,
        status: 'completed',
        ground: data.ground,
        message: `Event completed at ${data.ground}`,
        timestamp: new Date(),
      });
    });

    // === ATTENDANCE EVENTS ===
    socket.on('attendance:check-in', (data) => {
      io.emit('attendance:update', {
        userId: data.userId,
        action: 'check-in',
        timestamp: data.timestamp,
      });
      io.emit('dashboard:refresh'); // Trigger dashboard updates
    });

    socket.on('attendance:check-out', (data) => {
      io.emit('attendance:update', {
        userId: data.userId,
        action: 'check-out',
        timestamp: data.timestamp,
        duration: data.duration,
      });
      io.emit('dashboard:refresh');
    });

    // === KITCHEN ORDER EVENTS ===
    socket.on('order:created', (data) => {
      io.emit('kitchen:new-order', {
        orderId: data.orderId,
        items: data.items,
        timestamp: new Date(),
      });
    });

    socket.on('order:status-change', (data) => {
      io.emit('kitchen:order-status', {
        orderId: data.orderId,
        status: data.status,
        message: `Order ${data.status}`,
        timestamp: new Date(),
      });
    });

    // === INVENTORY EVENTS ===
    socket.on('inventory:low-stock', (data) => {
      io.emit('inventory:alert', {
        itemId: data.itemId,
        itemName: data.itemName,
        currentStock: data.currentStock,
        alertLevel: data.alertLevel,
        severity: 'high',
        timestamp: new Date(),
      });
    });

    socket.on('inventory:restocked', (data) => {
      io.emit('inventory:update', {
        itemId: data.itemId,
        itemName: data.itemName,
        newStock: data.newStock,
        timestamp: new Date(),
      });
    });

    // === MEMBERSHIP EVENTS ===
    socket.on('membership:expiring-soon', (data) => {
      io.emit('member:alert', {
        userId: data.userId,
        memberName: data.memberName,
        expiryDate: data.expiryDate,
        daysUntilExpiry: data.daysUntilExpiry,
        severity: 'medium',
        timestamp: new Date(),
      });
    });

    socket.on('membership:renewal', (data) => {
      io.emit('member:notification', {
        userId: data.userId,
        message: 'Membership renewed successfully',
        amount: data.amount,
        timestamp: new Date(),
      });
    });

    // === GENERAL EVENTS ===
    socket.on('dashboard:request-refresh', () => {
      io.emit('dashboard:refresh');
    });

    socket.on('disconnect', () => {
      console.log(`🔌 Client disconnected: ${socket.id}`);
    });
  });

  // Auto-emit real-time updates from backend
  return {
    // Payment notifications
    notifyPaymentSuccess: (paymentData) => {
      io.emit('payment:success', {
        paymentId: paymentData._id,
        amount: paymentData.totalAmount,
        type: paymentData.type,
        status: 'paid',
        timestamp: new Date(),
      });
      io.emit('dashboard:refresh');
    },

    notifyPaymentFailed: (orderId) => {
      io.emit('payment:failed', {
        orderId,
        timestamp: new Date(),
      });
    },

    // Slot notifications
    notifySlotBooked: (slotData) => {
      io.emit('slot:booked', {
        slotId: slotData._id,
        status: slotData.status,
        availabilityPercentage:
          ((slotData.capacity - slotData.currentBookings) / slotData.capacity) * 100,
        message: `Slot booked for ${slotData.name}`,
        timestamp: new Date(),
      });
    },

    // Attendance notifications
    notifyCheckIn: (userId, userName) => {
      io.emit('attendance:checked-in', {
        userId,
        userName,
        timestamp: new Date(),
      });
      io.emit('dashboard:refresh');
    },

    notifyCheckOut: (userId, userName, duration) => {
      io.emit('attendance:checked-out', {
        userId,
        userName,
        duration,
        timestamp: new Date(),
      });
      io.emit('dashboard:refresh');
    },

    // Operations notifications
    notifyOperationStarted: (eventData) => {
      io.emit('operation:started', {
        eventId: eventData._id,
        title: eventData.title,
        ground: eventData.ground,
        message: `${eventData.title} started at ${eventData.ground}`,
        timestamp: new Date(),
      });
      io.emit('dashboard:refresh');
    },

    // Broadcast activity feed
    addActivityFeed: (activity) => {
      io.emit('activity:new', {
        id: activity.id,
        type: activity.type,
        title: activity.title,
        description: activity.description,
        severity: activity.severity || 'low',
        timestamp: new Date(),
      });
    },
  };
};
