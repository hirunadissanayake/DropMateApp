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
  Alert,
  RefreshControl,
  TouchableWithoutFeedback,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import Svg, { Path, Circle } from 'react-native-svg';
import { Typography } from '../constants/Typography';
import { useAuthStore } from '../store/authStore';
import * as bankService from '../services/bankService';
import { BankDetail } from '../services/bankService';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import BackButton from '../components/common/BackButton';
import CustomAlert from '../components/common/CustomAlert';
import Toast from 'react-native-toast-message';

const BRAND_GREEN = '#00875A';
const BRAND_DARK = '#004D3A';

const BankDetailsScreen = () => {
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

  const isSaveDisabled = isSaving || !isFormValid || !hasChanges;

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
    } else if (/^\d+$/.test(bankName.trim())) {
      newErrors.bankName = 'Bank name cannot be only numbers';
    }

    if (!accountNumber.trim()) {
      newErrors.accountNumber = 'Account number is required';
    }

    if (!accountHolderName.trim()) {
      newErrors.accountHolderName = 'Account holder name is required';
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
        <ActivityIndicator size="large" color={BRAND_GREEN} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <View style={styles.header}>
          <BackButton onPress={() => navigation.goBack()} />
          <Text style={styles.headerTitle}>Bank Accounts</Text>
          <TouchableOpacity 
            style={styles.addHeaderBtn}
            onPress={() => { resetForm(); setShowModal(true); }}
          >
            <Svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={BRAND_GREEN} strokeWidth="2.5">
               <Path d="M12 5v14M5 12h14" />
            </Svg>
          </TouchableOpacity>
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[BRAND_GREEN]} />
          }
        >
          <Text style={styles.sectionDesc}>
            Manage your saved bank accounts for faster payout requests.
          </Text>

          {bankAccounts.length === 0 ? (
            <View style={styles.emptyState}>
              <View style={styles.emptyIconCircle}>
                 <Svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#CBD5E1" strokeWidth="1.5">
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
                    <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={BRAND_GREEN} strokeWidth="2">
                      <Path d="M3 21h18M3 10h18M5 6l7-3 7 3M4 10v11M20 10v11" />
                    </Svg>
                  </View>
                  <View style={styles.bankTextContent}>
                    <View style={styles.bankTitleRow}>
                      <Text style={styles.bankNameText}>{bank.bankName}</Text>
                      {bank.isDefault && <View style={styles.defaultBadge}><Text style={styles.defaultBadgeText}>Default</Text></View>}
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
                  <Svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2">
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
                <Text style={styles.inputLabel}>Bank Name *</Text>
                <TextInput
                  style={[styles.modalInput, errors.bankName && styles.inputError]}
                  placeholder="e.g. Commercial Bank"
                  value={bankName}
                  onChangeText={(t) => { setBankName(t); if (errors.bankName) setErrors({...errors, bankName: null}); }}
                  placeholderTextColor="#94A3B8"
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
                  placeholderTextColor="#94A3B8"
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
                  placeholderTextColor="#94A3B8"
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
                  placeholderTextColor="#94A3B8"
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

      {/* Delete Confirmation Alert */}
      <CustomAlert
        visible={deleteAlertVisible}
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

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  safeArea: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  headerTitle: { fontSize: 20, fontFamily: Typography.bold, color: '#0F172A' },
  addHeaderBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 40 },
  sectionDesc: { 
    fontSize: 14, 
    color: '#64748B', 
    fontFamily: Typography.medium, 
    marginBottom: 24,
    lineHeight: 20
  },
  bankCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    padding: 18,
    borderRadius: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  bankInfo: { flexDirection: 'row', flex: 1 },
  bankIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#F0FDF4',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  bankTextContent: { flex: 1 },
  bankTitleRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  bankNameText: { fontSize: 16, fontFamily: Typography.bold, color: '#1E293B', marginRight: 8 },
  defaultBadge: { backgroundColor: '#DCFCE7', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
  defaultBadgeText: { fontSize: 10, color: BRAND_GREEN, fontFamily: Typography.bold },
  accNoText: { fontSize: 14, color: '#475569', fontFamily: Typography.bold, marginBottom: 2 },
  holderNameText: { fontSize: 13, color: '#64748B', fontFamily: Typography.medium },
  branchText: { fontSize: 12, color: '#94A3B8', fontFamily: Typography.regular, marginTop: 2 },
  deleteBtn: { padding: 8 },
  emptyState: { alignItems: 'center', paddingVertical: 60, marginTop: 20 },
  emptyIconCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  emptyText: { fontSize: 16, fontFamily: Typography.bold, color: '#94A3B8', marginBottom: 24 },
  addInitialBtn: { backgroundColor: BRAND_GREEN, paddingHorizontal: 32, paddingVertical: 14, borderRadius: 100 },
  addInitialBtnText: { color: '#FFFFFF', fontFamily: Typography.bold, fontSize: 15 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.5)', justifyContent: 'flex-end' },
  modalSheet: { backgroundColor: '#FFFFFF', borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 24, maxHeight: '85%' },
  modalIndicator: { width: 40, height: 4, backgroundColor: '#E2E8F0', borderRadius: 2, alignSelf: 'center', marginBottom: 20 },
  modalHeader: { marginBottom: 24 },
  modalTitle: { fontSize: 20, fontFamily: Typography.bold, color: '#0F172A' },
  inputGroup: { marginBottom: 20 },
  inputLabel: { fontSize: 13, fontFamily: Typography.bold, color: '#475569', marginBottom: 8 },
  modalInput: { backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#F1F5F9', borderRadius: 14, paddingHorizontal: 16, paddingVertical: 12, fontSize: 15, fontFamily: Typography.medium, color: '#0F172A' },
  inputError: { borderColor: '#EF4444' },
  errorText: { color: '#EF4444', fontSize: 12, marginTop: 6, marginLeft: 4, fontFamily: Typography.medium },
  saveBtn: { backgroundColor: BRAND_GREEN, borderRadius: 16, paddingVertical: 16, alignItems: 'center', marginTop: 10, marginBottom: 12 },
  saveBtnText: { color: '#FFFFFF', fontFamily: Typography.bold, fontSize: 16 },
  modalCancelBtn: { alignItems: 'center', paddingVertical: 12 },
  modalCancelBtnText: { color: '#94A3B8', fontFamily: Typography.bold, fontSize: 15 },
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
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  checkboxActive: {
    backgroundColor: BRAND_GREEN,
    borderColor: BRAND_GREEN,
  },
  defaultTextContent: {
    flex: 1,
  },
  defaultTitleText: {
    fontSize: 15,
    fontFamily: Typography.bold,
    color: '#1E293B',
  },
  defaultSubText: {
    fontSize: 12,
    color: '#64748B',
    fontFamily: Typography.medium,
    marginTop: 2,
  },
});

export default BankDetailsScreen;
