import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path, Circle } from 'react-native-svg';
import { Typography } from '../constants/Typography';
import { Colors } from '../constants/Colors';
import { useAnnouncementStore } from '../store/announcementStore';
import { useNavigation } from '@react-navigation/native';
import BackButton from '../components/common/BackButton';
import LinearGradient from 'react-native-linear-gradient';
import dayjs from 'dayjs';
import { socketService } from '../services/socketService';

const { width } = Dimensions.get('window');

const AnnouncementsScreen = () => {
  const navigation = useNavigation();
  const { announcements, clearUnread } = useAnnouncementStore();
  const [refreshing, setRefreshing] = React.useState(false);

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    socketService.getHistory();
    // Simulation of network delay or just wait for socket
    setTimeout(() => setRefreshing(false), 1500);
  }, []);

  React.useEffect(() => {
    clearUnread();
    socketService.getHistory();
  }, []);

  const sortedAnnouncements = React.useMemo(() => {
    return [...announcements].sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [announcements]);

const AnnouncementCard = ({ item }: { item: any }) => {
  const [expanded, setExpanded] = React.useState(false);
  const [numLines, setNumLines] = React.useState(0);

  const isLongMessage = numLines > 3;

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.headerLeft}>
          <View style={styles.iconCircle}>
            <LinearGradient
              colors={[Colors.primary, '#064E3B']}
              style={styles.iconGradient}
            >
              <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <Path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0" />
              </Svg>
            </LinearGradient>
          </View>
          <View style={styles.headerInfo}>
            <Text style={styles.senderName}>{item.senderName || 'DropMate Admin'}</Text>
            <View style={styles.timeRow}>
              <Svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2">
                <Circle cx="12" cy="12" r="10" /><Path d="M12 6v6l4 2" />
              </Svg>
              <Text style={styles.timeText}>{dayjs(item.createdAt).format('DD MMM, hh:mm A')}</Text>
            </View>
          </View>
        </View>
      </View>
      
      <TouchableOpacity 
        activeOpacity={0.9} 
        onPress={() => isLongMessage && setExpanded(!expanded)}
        style={styles.contentArea}
      >
        <Text 
          style={styles.messageText}
          numberOfLines={expanded ? undefined : 3}
          onTextLayout={(e) => {
            if (!expanded) setNumLines(e.nativeEvent.lines.length);
          }}
        >
          {item.message}
        </Text>
        
        {isLongMessage && (
          <View style={styles.expandAction}>
             <Text style={styles.expandText}>{expanded ? 'Show Less' : 'Read More'}</Text>
             <View style={[styles.arrowBox, expanded && { transform: [{ rotate: '180deg' }] }]}>
                <Svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={Colors.primary} strokeWidth="3">
                   <Path d="M6 9l6 6 6-6" />
                </Svg>
             </View>
          </View>
        )}
      </TouchableOpacity>
    </View>
  );
};

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      
      <LinearGradient colors={[Colors.primary, '#004D3A']} style={styles.headerGradient}>
        <SafeAreaView edges={['top']}>
          <View style={styles.header}>
            <BackButton color="#FFFFFF" onPress={() => navigation.goBack()} />
            <View style={styles.headerTitleContainer}>
               <Text style={styles.headerTitle}>Announcement Center</Text>
               <Text style={styles.headerSubtitle}>Official updates from DropMate</Text>
            </View>
            <View style={{ width: 40 }} />
          </View>
        </SafeAreaView>
      </LinearGradient>

      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollPadding}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh} 
            colors={[Colors.primary]}
            tintColor={Colors.primary}
          />
        }
      >
        {sortedAnnouncements.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconCircle}>
               <LinearGradient colors={['#F1F5F9', '#E2E8F0']} style={styles.emptyGradient}>
                  <Svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="1.5">
                    <Path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0" />
                  </Svg>
               </LinearGradient>
            </View>
            <Text style={styles.emptyTitle}>No Announcements Yet</Text>
            <Text style={styles.emptySubtitle}>We'll keep you posted with the latest updates and important news here.</Text>
          </View>
        ) : (
          sortedAnnouncements.map(item => <AnnouncementCard key={item.id} item={item} />)
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  headerGradient: {
    paddingBottom: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
  headerTitle: {
    fontSize: 22,
    fontFamily: Typography.bold,
    color: '#FFFFFF',
  },
  headerSubtitle: {
    fontSize: 12,
    fontFamily: Typography.medium,
    color: 'rgba(255,255,255,0.7)',
    marginTop: -2,
  },
  headerTitleContainer: {
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  scrollPadding: {
    padding: 20,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconCircle: {
    width: 60,
    height: 60,
    borderRadius: 18,
    overflow: 'hidden',
    marginRight: 16,
  },
  iconGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerInfo: {
    flex: 1,
  },
  senderName: {
    fontSize: 17,
    fontFamily: Typography.bold,
    color: '#0F172A',
    marginBottom: 2,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  timeText: {
    fontSize: 12,
    fontFamily: Typography.medium,
    color: '#94A3B8',
  },
  broadcastBadge: {
    backgroundColor: Colors.primary + '10',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  broadcastBadgeText: {
    fontSize: 10,
    fontFamily: Typography.bold,
    color: Colors.primary,
    letterSpacing: 0.5,
  },
  contentArea: {
    marginBottom: 24,
  },
  messageText: {
    fontSize: 15,
    fontFamily: Typography.semiBold,
    color: '#334155',
    lineHeight: 24,
  },
  expandAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
  },
  expandText: {
    fontSize: 13,
    fontFamily: Typography.bold,
    color: Colors.primary,
  },
  arrowBox: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardFooter: {
    marginTop: 'auto',
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginBottom: 16,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  footerBrand: {
    fontSize: 11,
    fontFamily: Typography.bold,
    color: '#94A3B8',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  verifiedBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.primary + '08',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  verifiedText: {
    fontSize: 10,
    fontFamily: Typography.bold,
    color: Colors.primary,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 100,
    paddingHorizontal: 40,
  },
  emptyIconCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    overflow: 'hidden',
    marginBottom: 32,
  },
  emptyGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 22,
    fontFamily: Typography.bold,
    color: '#1E293B',
    marginBottom: 12,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 15,
    fontFamily: Typography.medium,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 24,
  },
});

export default AnnouncementsScreen;
