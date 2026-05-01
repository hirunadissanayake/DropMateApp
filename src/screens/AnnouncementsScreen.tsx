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
import { useTheme } from '../context/ThemeContext';
import { AppTheme } from '../constants/Colors';
import { useAnnouncementStore } from '../store/announcementStore';
import { useNavigation } from '@react-navigation/native';
import BackButton from '../components/common/BackButton';
import LinearGradient from 'react-native-linear-gradient';
import dayjs from 'dayjs';
import { socketService } from '../services/socketService';

const { width } = Dimensions.get('window');

const AnnouncementsScreen = () => {
  const { theme, isDark } = useTheme();
  const s = makeStyles(theme);
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
    <View style={s.card}>
      <View style={s.cardHeader}>
        <View style={s.headerLeft}>
          <View style={s.iconCircle}>
            <LinearGradient
              colors={[theme.primary, theme.primaryDark]}
              style={s.iconGradient}
            >
              <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <Path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0" />
              </Svg>
            </LinearGradient>
          </View>
          <View style={s.headerInfo}>
            <Text style={s.senderName}>{item.senderName || 'DropMate Admin'}</Text>
            <View style={s.timeRow}>
              <Svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={theme.text.tertiary} strokeWidth="2">
                <Circle cx="12" cy="12" r="10" /><Path d="M12 6v6l4 2" />
              </Svg>
              <Text style={s.timeText}>{dayjs(item.createdAt).format('DD MMM, hh:mm A')}</Text>
            </View>
          </View>
        </View>
      </View>
      
      <TouchableOpacity 
        activeOpacity={0.9} 
        onPress={() => isLongMessage && setExpanded(!expanded)}
        style={s.contentArea}
      >
        <Text 
          style={s.messageText}
          numberOfLines={expanded ? undefined : 3}
          onTextLayout={(e) => {
            if (!expanded) setNumLines(e.nativeEvent.lines.length);
          }}
        >
          {item.message}
        </Text>
        
        {isLongMessage && (
          <View style={s.expandAction}>
             <Text style={s.expandText}>{expanded ? 'Show Less' : 'Read More'}</Text>
             <View style={[s.arrowBox, expanded && { transform: [{ rotate: '180deg' }] }]}>
                <Svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={theme.primary} strokeWidth="3">
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
    <View style={s.container}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} translucent backgroundColor="transparent" />
      
      <LinearGradient colors={[theme.primary, theme.primaryDark]} style={s.headerGradient}>
        <SafeAreaView edges={['top']}>
          <View style={s.header}>
            <BackButton color="#FFFFFF" onPress={() => navigation.goBack()} />
            <View style={s.headerTitleContainer}>
               <Text style={s.headerTitle}>Announcement Center</Text>
               <Text style={s.headerSubtitle}>Official updates from DropMate</Text>
            </View>
            <View style={{ width: 40 }} />
          </View>
        </SafeAreaView>
      </LinearGradient>

      <ScrollView 
        style={s.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.scrollPadding}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh} 
            colors={[theme.primary]}
            tintColor={theme.primary}
          />
        }
      >
        {sortedAnnouncements.length === 0 ? (
          <View style={s.emptyState}>
            <View style={s.emptyIconCircle}>
               <LinearGradient colors={theme.isDark ? ['#1A3D30', '#0D1F18'] : ['#F1F5F9', '#E2E8F0']} style={s.emptyGradient}>
                  <Svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke={theme.text.tertiary} strokeWidth="1.5">
                    <Path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0" />
                  </Svg>
               </LinearGradient>
            </View>
            <Text style={s.emptyTitle}>No Announcements Yet</Text>
            <Text style={s.emptySubtitle}>We'll keep you posted with the latest updates and important news here.</Text>
          </View>
        ) : (
          sortedAnnouncements.map(item => <AnnouncementCard key={item.id} item={item} />)
        )}
      </ScrollView>
    </View>
  );
};

const makeStyles = (theme: AppTheme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.background,
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
    backgroundColor: theme.card,
    borderRadius: 24,
    padding: 20,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: theme.isDark ? 0.3 : 0.04,
    shadowRadius: 12,
    elevation: 2,
    borderWidth: 1,
    borderColor: theme.border,
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
    color: theme.text.primary,
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
    color: theme.text.tertiary,
  },
  broadcastBadge: {
    backgroundColor: theme.primary + '10',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  broadcastBadgeText: {
    fontSize: 10,
    fontFamily: Typography.bold,
    color: theme.primary,
    letterSpacing: 0.5,
  },
  contentArea: {
    marginBottom: 12,
  },
  messageText: {
    fontSize: 15,
    fontFamily: Typography.semiBold,
    color: theme.text.secondary,
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
    color: theme.primary,
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
    backgroundColor: theme.border,
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
    color: theme.text.tertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  verifiedBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: theme.primary + '08',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  verifiedText: {
    fontSize: 10,
    fontFamily: Typography.bold,
    color: theme.primary,
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
    color: theme.text.primary,
    marginBottom: 12,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 15,
    fontFamily: Typography.medium,
    color: theme.text.tertiary,
    textAlign: 'center',
    lineHeight: 24,
  },
});

export default AnnouncementsScreen;
