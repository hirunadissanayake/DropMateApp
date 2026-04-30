import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  ActivityIndicator,
  Modal,
  TextInput,
  RefreshControl,
  TouchableWithoutFeedback,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path, Circle } from 'react-native-svg';
import { Typography } from '../constants/Typography';
import { useAuthStore } from '../store/authStore';
import * as bankService from '../services/bankService';
import { BankDetail } from '../services/bankService';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import BackButton from '../components/common/BackButton';
import CustomAlert from '../components/common/CustomAlert';
import CustomDropdown from '../components/common/CustomDropdown';
import Toast from 'react-native-toast-message';
import { useTheme } from '../context/ThemeContext';
import { AppTheme } from '../constants/Colors';

const BankDetailsScreen = () => {
  const { theme } = useTheme();
  const styles = makeStyles(theme);
  const navigation = useNavigation();
  const { token } = useAuthStore();
  const [bankAccounts, setBankAccounts] = useState<BankDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Modal state for adding/editing
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountHolderName, setAccountHolderName] = useState('');
  const [branchName, setBranchName] = useState('');
  const [isDefault, setIsDefault] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<any>({});

  // Delete Alert state
  const [deleteAlertVisible, setDeleteAlertVisible] = useState(false);
  const [bankToDelete, setBankToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const SRI_LANKAN_BANKS = [
    'Bank of Ceylon',
    'Commercial Bank of Ceylon',
    'Hatton National Bank',
    'Sampath Bank',
    'People\'s Bank',
    'Nations Trust Bank',
    'DFCC Bank',
    'Seylan Bank',
    'NDB Bank',
    'Pan Asia Bank',
    'Union Bank of Colombo',
    'Amana Bank',
    'Cargills Bank',
    'Sanasa Development Bank',
    'Regional Development Bank',
  ].sort();

  const isFormValid = 
    bankName.trim() !== '' &&
    accountNumber.trim() !== '' &&
    accountHolderName.trim() !== '' &&
    branchName.trim() !== '';

  const currentBank = bankAccounts.find(b => b.id === editingId);
  const hasChanges = editingId && currentBank
    ? (bankName.trim() !== (currentBank.bankName || '').trim() || 
       accountNumber.trim() !== (currentBank.accountNumber || '').trim() || 
       accountHolderName.trim() !== (currentBank.accountHolderName || '').trim() || 
       branchName.trim() !== (currentBank.branchName || '').trim() ||
       isDefault !== (currentBank.isDefault || false))
    : true;

  const isSaveDisabled = isSaving;

  const fetchBankDetails = async () => {
    try {
      const data = await bankService.getBankDetails(token!);
      setBankAccounts(data);
    } catch (error) {
      console.error('Fetch bank details error:', error);
      Toast.show({ type: 'error', text1: 'Error', text2: 'Could not fetch bank details' });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(useCallback(() => {
    fetchBankDetails();
  }, [token]));

  const onRefresh = () => {
    setRefreshing(true);
    fetchBankDetails();
  };

  const handleSave = async () => {
    const newErrors: any = {};

    if (!bankName.trim()) {
      newErrors.bankName = 'Bank name is required';
    }

    if (!accountNumber.trim()) {
      newErrors.accountNumber = 'Account number is required';
    } else if (!/^\d+$/.test(accountNumber.trim())) {
      newErrors.accountNumber = 'Account number must be numeric';
    }

    if (!accountHolderName.trim()) {
      newErrors.accountHolderName = 'Holder name is required';
    } else if (/^\d+$/.test(accountHolderName.trim())) {
      newErrors.accountHolderName = 'Name cannot be only numbers';
    }

    if (!branchName.trim()) {
      newErrors.branchName = 'Branch name is required';
    } else if (/^\d+$/.test(branchName.trim())) {
      newErrors.branchName = 'Branch name cannot be only numbers';
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      Toast.show({
        type: 'error',
        text1: 'Incomplete Information',
        text2: 'Please fill in all required fields correctly'
      });
      return;
    }

    if (editingId && currentBank && !hasChanges) {
       Toast.show({ type: 'info', text1: 'No Changes', text2: 'No modifications detected' });
       setShowModal(false);
       return;
    }

    setIsSaving(true);
    try {
      const data = { bankName, accountNumber, accountHolderName, branchName, isDefault };
      if (editingId) {
        await bankService.updateBankDetail(token!, editingId, data);
        Toast.show({ type: 'success', text1: 'Success', text2: 'Bank detail updated' });
      } else {
        await bankService.addBankDetail(token!, data);
        Toast.show({ type: 'success', text1: 'Success', text2: 'Bank detail added' });
      }
      setShowModal(false);
      resetForm();
      fetchBankDetails();
    } catch (error) {
      Toast.show({ type: 'error', text1: 'Error', text2: 'Could not save bank detail' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeletePrompt = (id: string) => {
    setBankToDelete(id);
    setDeleteAlertVisible(true);
  };

  const confirmDelete = async () => {
    if (!bankToDelete) return;
    setIsDeleting(true);
    try {
      await bankService.deleteBankDetail(token!, bankToDelete);
      Toast.show({ type: 'success', text1: 'Deleted', text2: 'Bank account removed' });
      setDeleteAlertVisible(false);
      setBankToDelete(null);
      fetchBankDetails();
    } catch (error) {
      Toast.show({ type: 'error', text1: 'Error', text2: 'Could not delete bank account' });
      setDeleteAlertVisible(false);
      setBankToDelete(null);
    } finally {
      setIsDeleting(false);
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setBankName('');
    setAccountNumber('');
    setAccountHolderName('');
    setBranchName('');
    setIsDefault(false);
    setErrors({});
  };

  const openEdit = (bank: BankDetail) => {
    setEditingId(bank.id);
    setBankName(bank.bankName);
    setAccountNumber(bank.accountNumber);
    setAccountHolderName(bank.accountHolderName);
    setBranchName(bank.branchName || '');
    setIsDefault(bank.isDefault || false);
    setShowModal(true);
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle={theme.statusBar} backgroundColor="transparent" translucent />
      
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <View style={styles.header}>
          <BackButton 
            onPress={() => navigation.goBack()}
            style={styles.backBtn}
            color={theme.primary}
          />
          <Text style={styles.headerTitle}>Bank Accounts</Text>
          <TouchableOpacity 
            style={styles.addHeaderBtn}
            onPress={() => { resetForm(); setShowModal(true); }}
          >
            <Svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={theme.primary} strokeWidth="2.5">
               <Path d="M12 5v14M5 12h14" />
            </Svg>
          </TouchableOpacity>
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} colors={[theme.primary]} />
          }
        >
          <Text style={styles.sectionDesc}>
            Manage your saved bank accounts for faster payout requests.
          </Text>

          {bankAccounts.length === 0 ? (
            <View style={styles.emptyState}>
              <View style={styles.emptyIconCircle}>
                 <Svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke={theme.isDark ? theme.primary : theme.text.tertiary} strokeWidth="1.5">
                    <Path d="M3 21h18M3 10h18M5 6l7-3 7 3M4 10v11M20 10v11M8 14v3M12 14v3M16 14v3" />
                 </Svg>
              </View>
              <Text style={styles.emptyText}>No bank accounts saved</Text>
              <TouchableOpacity 
                style={styles.addInitialBtn}
                onPress={() => { resetForm(); setShowModal(true); }}
              >
                <Text style={styles.addInitialBtnText}>Add Bank Account</Text>
              </TouchableOpacity>
            </View>
          ) : (
            bankAccounts.map((bank) => (
              <View 
                key={bank.id} 
                style={styles.bankCard}
              >
                <TouchableOpacity 
                  style={styles.bankInfo}
                  onPress={() => openEdit(bank)}
                  activeOpacity={0.7}
                >
                  <View style={styles.bankIconContainer}>
                    <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={theme.primary} strokeWidth="2.5">
                      <Path d="M3 21h18M3 10h18M5 6l7-3 7 3M4 10v11M20 10v11" />
                    </Svg>
                  </View>
                  <View style={styles.bankTextContent}>
                    <View style={styles.bankTitleRow}>
                      <Text style={styles.bankNameText}>{bank.bankName}</Text>
                      {bank.isDefault && (
                        <View style={styles.defaultBadge}>
                          <Text style={styles.defaultBadgeText}>Default</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.accNoText}>Acc: {bank.accountNumber}</Text>
                    <Text style={styles.holderNameText}>{bank.accountHolderName}</Text>
                    {bank.branchName ? <Text style={styles.branchText}>{bank.branchName} Branch</Text> : null}
                  </View>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.deleteBtn}
                  onPress={() => handleDeletePrompt(bank.id)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2.5">
                    <Path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M10 11v6M14 11v6" />
                  </Svg>
                </TouchableOpacity>
              </View>
            ))
          )}
        </ScrollView>
      </SafeAreaView>

      {/* Add/Edit Modal */}
      <Modal visible={showModal} animationType="slide" transparent onRequestClose={() => setShowModal(false)}>
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1} 
          onPress={() => setShowModal(false)}
        >
          <TouchableWithoutFeedback onPress={() => {}}>
            <View style={styles.modalSheet}>
              <View style={styles.modalHeader}>
              <View style={styles.modalIndicator} />
              <Text style={styles.modalTitle}>{editingId ? 'Edit Bank Account' : 'Add Bank Account'}</Text>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.inputGroup}>
                <CustomDropdown 
                   label="Bank Name *"
                   options={SRI_LANKAN_BANKS}
                   selectedOption={bankName}
                   onSelect={(val) => {
                      setBankName(val);
                      if (errors.bankName) setErrors({...errors, bankName: null});
                   }}
                   placeholder="Select your bank"
                   theme={theme}
                />
                {errors.bankName && <Text style={styles.errorText}>{errors.bankName}</Text>}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Account Number *</Text>
                <TextInput
                  style={[styles.modalInput, errors.accountNumber && styles.inputError]}
                  placeholder="Enter account number"
                  keyboardType="numeric"
                  value={accountNumber}
                  onChangeText={(t) => { setAccountNumber(t); if (errors.accountNumber) setErrors({...errors, accountNumber: null}); }}
                  placeholderTextColor={theme.text.placeholder}
                />
                {errors.accountNumber && <Text style={styles.errorText}>{errors.accountNumber}</Text>}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Account Holder Name *</Text>
                <TextInput
                  style={[styles.modalInput, errors.accountHolderName && styles.inputError]}
                  placeholder="Name as in bank book"
                  value={accountHolderName}
                  onChangeText={(t) => { setAccountHolderName(t); if (errors.accountHolderName) setErrors({...errors, accountHolderName: null}); }}
                  placeholderTextColor={theme.text.placeholder}
                />
                {errors.accountHolderName && <Text style={styles.errorText}>{errors.accountHolderName}</Text>}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Branch Name *</Text>
                <TextInput
                  style={[styles.modalInput, errors.branchName && styles.inputError]}
                  placeholder="e.g. Colombo 07"
                  value={branchName}
                  onChangeText={(t) => { setBranchName(t); if (errors.branchName) setErrors({...errors, branchName: null}); }}
                  placeholderTextColor={theme.text.placeholder}
                />
                {errors.branchName && <Text style={styles.errorText}>{errors.branchName}</Text>}
              </View>
              
              {((editingId && bankAccounts.length > 1) || (!editingId && bankAccounts.length > 0)) && (
                <TouchableOpacity 
                  style={styles.defaultOptionRow}
                  onPress={() => setIsDefault(!isDefault)}
                  activeOpacity={0.8}
                >
                  <View style={[styles.checkbox, isDefault && styles.checkboxActive]}>
                    {isDefault && (
                      <Svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="4">
                        <Path d="M20 6L9 17l-5-5" />
                      </Svg>
                    )}
                  </View>
                  <View style={styles.defaultTextContent}>
                    <Text style={styles.defaultTitleText}>Set as Default Account</Text>
                    <Text style={styles.defaultSubText}>Primary account for all your payout requests.</Text>
                  </View>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={[styles.saveBtn, isSaveDisabled && { opacity: 0.6 }]}
                onPress={handleSave}
                disabled={isSaveDisabled}
              >
                {isSaving
                  ? <ActivityIndicator color="#fff" />
                  : <Text style={styles.saveBtnText}>{editingId ? 'Update Account' : 'Save Account'}</Text>}
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.modalCancelBtn} 
                onPress={() => setShowModal(false)}
              >
                <Text style={styles.modalCancelBtnText}>Cancel</Text>
              </TouchableOpacity>
            </ScrollView>
            </View>
          </TouchableWithoutFeedback>
        </TouchableOpacity>
      </Modal>

      <CustomAlert
        visible={deleteAlertVisible}
        theme={theme}
        title="Delete Bank Account"
        message="Are you sure you want to remove this bank account?"
        confirmText="Delete"
        cancelText="Cancel"
        type="error"
        loading={isDeleting}
        onConfirm={confirmDelete}
        onCancel={() => {
          setDeleteAlertVisible(false);
          setBankToDelete(null);
        }}
      />
    </View>
  );
};

const makeStyles = (theme: AppTheme) => StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.background },
  safeArea: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  headerTitle: { fontSize: 20, fontFamily: Typography.bold, color: theme.text.primary },
  backBtn: {
    padding: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addHeaderBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 40 },
  sectionDesc: { 
    fontSize: 14, 
    color: theme.text.secondary, 
    fontFamily: Typography.medium, 
    marginBottom: 24,
    lineHeight: 20
  },
  bankCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.card,
    padding: 18,
    borderRadius: 24,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: theme.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  bankInfo: { flexDirection: 'row', flex: 1 },
  bankIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: theme.isDark ? 'rgba(61, 217, 164, 0.1)' : '#E6F5EF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  bankTextContent: { flex: 1 },
  bankTitleRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  bankNameText: { fontSize: 16, fontFamily: Typography.bold, color: theme.text.primary, marginRight: 8 },
  defaultBadge: { 
    backgroundColor: theme.isDark ? 'rgba(61, 217, 164, 0.2)' : '#DCFCE7', 
    paddingHorizontal: 8, 
    paddingVertical: 3, 
    borderRadius: 6 
  },
  defaultBadgeText: { fontSize: 10, color: theme.primary, fontFamily: Typography.extraBold },
  accNoText: { fontSize: 14, color: theme.text.primary, fontFamily: Typography.bold, marginBottom: 2 },
  holderNameText: { fontSize: 13, color: theme.text.secondary, fontFamily: Typography.medium },
  branchText: { fontSize: 12, color: theme.text.tertiary, fontFamily: Typography.regular, marginTop: 2 },
  deleteBtn: { padding: 8 },
  emptyState: { alignItems: 'center', paddingVertical: 60, marginTop: 20 },
  emptyIconCircle: { 
    width: 100, 
    height: 100, 
    borderRadius: 50, 
    backgroundColor: theme.isDark ? 'rgba(61, 217, 164, 0.1)' : theme.inputBg, 
    alignItems: 'center', 
    justifyContent: 'center', 
    marginBottom: 24 
  },
  emptyText: { fontSize: 18, fontFamily: Typography.bold, color: theme.text.primary, marginBottom: 24 },
  addInitialBtn: { backgroundColor: theme.primary, paddingHorizontal: 40, paddingVertical: 16, borderRadius: 100 },
  addInitialBtnText: { color: '#FFFFFF', fontFamily: Typography.bold, fontSize: 15 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.6)', justifyContent: 'flex-end' },
  modalSheet: { 
    backgroundColor: theme.card, 
    borderTopLeftRadius: 40, 
    borderTopRightRadius: 40, 
    padding: 24, 
    maxHeight: '85%',
    borderWidth: 1,
    borderColor: theme.border,
  },
  modalIndicator: { width: 40, height: 4, backgroundColor: theme.border, borderRadius: 2, alignSelf: 'center', marginBottom: 20 },
  modalHeader: { marginBottom: 24 },
  modalTitle: { fontSize: 22, fontFamily: Typography.bold, color: theme.text.primary },
  inputGroup: { marginBottom: 20 },
  inputLabel: { fontSize: 13, fontFamily: Typography.bold, color: theme.text.secondary, marginBottom: 8 },
  modalInput: { 
    backgroundColor: theme.isDark ? 'rgba(255,255,255,0.05)' : theme.inputBg, 
    borderWidth: 1, 
    borderColor: theme.border, 
    borderRadius: 16, 
    paddingHorizontal: 20, 
    paddingVertical: 14, 
    fontSize: 15, 
    fontFamily: Typography.medium, 
    color: theme.text.primary 
  },
  inputError: { borderColor: '#EF4444' },
  errorText: { color: '#EF4444', fontSize: 12, marginTop: 6, marginLeft: 4, fontFamily: Typography.medium },
  saveBtn: { backgroundColor: theme.primary, borderRadius: 18, paddingVertical: 18, alignItems: 'center', marginTop: 10, marginBottom: 12 },
  saveBtnText: { color: '#FFFFFF', fontFamily: Typography.bold, fontSize: 16 },
  modalCancelBtn: { alignItems: 'center', paddingVertical: 12 },
  modalCancelBtnText: { color: theme.text.tertiary, fontFamily: Typography.bold, fontSize: 15 },
  defaultOptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    marginBottom: 8,
    gap: 12,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: theme.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.inputBg,
  },
  checkboxActive: {
    backgroundColor: theme.primary,
    borderColor: theme.primary,
  },
  defaultTextContent: {
    flex: 1,
  },
  defaultTitleText: {
    fontSize: 15,
    fontFamily: Typography.bold,
    color: theme.text.primary,
  },
  defaultSubText: {
    fontSize: 12,
    color: theme.text.tertiary,
    fontFamily: Typography.medium,
    marginTop: 2,
  },
});

export default BankDetailsScreen;
