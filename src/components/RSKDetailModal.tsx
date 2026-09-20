import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { RSKLocation, RSKOfficer } from '../data/karnataka/rsk';
import { RSKService } from '../services/rskService';
import { useI18n } from '../services/i18n';

interface RSKDetailModalProps {
  visible: boolean;
  location: RSKLocation | null;
  onClose: () => void;
}

export const RSKDetailModal: React.FC<RSKDetailModalProps> = ({
  visible,
  location,
  onClose,
}) => {
  const { t } = useI18n();

  if (!location) return null;

  const isRsk = location.office_type === 'RSK';

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <SafeAreaView style={styles.modalCard}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <View style={styles.titleWrap}>
              <View style={styles.badgeRow}>
                <View style={[styles.typeBadge, isRsk ? styles.rskBadge : styles.deptBadge]}>
                  <Text style={[styles.typeBadgeText, isRsk ? styles.rskBadgeText : styles.deptBadgeText]}>
                    {isRsk ? '🌾 RSK CENTER' : '🏛️ DEPT OFFICE'}
                  </Text>
                </View>
                <View style={styles.verifiedBadge}>
                  <Text style={styles.verifiedBadgeText}>✓ OFFICIAL DIRECTORY</Text>
                </View>
              </View>
              <Text style={styles.modalTitle}>{location.name}</Text>
            </View>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose} activeOpacity={0.7}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
            {/* Geographic Hierarchy Card */}
            <View style={styles.infoSection}>
              <Text style={styles.sectionHeading}>📍 Location Hierarchy</Text>
              <View style={styles.gridRow}>
                <View style={styles.gridCol}>
                  <Text style={styles.gridLabel}>District</Text>
                  <Text style={styles.gridValue}>{location.district}</Text>
                </View>
                <View style={styles.gridCol}>
                  <Text style={styles.gridLabel}>Taluk</Text>
                  <Text style={styles.gridValue}>{location.taluk}</Text>
                </View>
              </View>

              {location.hobli ? (
                <View style={styles.hobliBanner}>
                  <Text style={styles.hobliBannerText}>🌾 Verified Hobli: {location.hobli}</Text>
                </View>
              ) : (
                <Text style={styles.fieldCircleNote}>
                  ℹ️ Hobli field circle: Centered at {location.name}
                </Text>
              )}

              {location.place ? (
                <View style={styles.addressBox}>
                  <Text style={styles.addressLabel}>🏢 Official Place / Workplace:</Text>
                  <Text style={styles.addressValue}>{location.place}</Text>
                  {location.pincode && (
                    <Text style={styles.pincodeValue}>📮 PIN: {location.pincode}</Text>
                  )}
                </View>
              ) : null}
            </View>

            {/* Quick Actions Row */}
            <View style={styles.actionsRow}>
              {location.phones.length > 0 && (
                <TouchableOpacity
                  style={styles.primaryCallBtn}
                  activeOpacity={0.85}
                  onPress={() => RSKService.callNumber(location.phones[0])}
                >
                  <Text style={styles.primaryCallBtnText}>📞 Call {location.phones[0]}</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={styles.directionsBtn}
                activeOpacity={0.85}
                onPress={() => RSKService.openDirections(location)}
              >
                <Text style={styles.directionsBtnText}>🗺️ Open Directions</Text>
              </TouchableOpacity>
            </View>

            {/* Officers Directory */}
            <View style={styles.infoSection}>
              <Text style={styles.sectionHeading}>
                👥 Designated Officers ({location.officers.length})
              </Text>
              {location.officers.map((officer, idx) => (
                <View key={idx} style={styles.officerCard}>
                  <View style={styles.officerHeader}>
                    <Text style={styles.officerDesignation}>{officer.designation}</Text>
                    {officer.officer_name && (
                      <Text style={styles.officerName}>👤 {officer.officer_name}</Text>
                    )}
                  </View>

                  {officer.phone ? (
                    <View style={styles.officerContactRow}>
                      <Text style={styles.officerPhone}>📱 {officer.phone}</Text>
                      <TouchableOpacity
                        style={styles.callSmallBtn}
                        activeOpacity={0.8}
                        onPress={() => RSKService.callNumber(officer.phone!)}
                      >
                        <Text style={styles.callSmallBtnText}>📞 Call</Text>
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <Text style={styles.noPhoneText}>No direct phone listed in directory</Text>
                  )}
                </View>
              ))}
            </View>

            {/* Verification Footer */}
            <View style={styles.sourceFooter}>
              <Text style={styles.sourceFooterText}>
                Official Source: Karnataka Agriculture Department CUG Directory
              </Text>
              <Text style={styles.sourceLinesText}>
                Source Record Lines: {location.source_lines.join(', ')}
              </Text>
            </View>
          </ScrollView>
        </SafeAreaView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#EBEFEB',
  },
  titleWrap: {
    flex: 1,
    paddingRight: 12,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  rskBadge: {
    backgroundColor: '#E8F5E9',
  },
  deptBadge: {
    backgroundColor: '#E3F2FD',
  },
  typeBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  rskBadgeText: {
    color: '#2E7D32',
  },
  deptBadgeText: {
    color: '#1565C0',
  },
  verifiedBadge: {
    backgroundColor: '#FFF3E0',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  verifiedBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#E65100',
  },
  modalTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: '#1B3B2B',
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F4F1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnText: {
    fontSize: 16,
    color: '#4A5568',
    fontWeight: 'bold',
  },
  modalBody: {
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 30,
  },
  infoSection: {
    marginBottom: 16,
  },
  sectionHeading: {
    fontSize: 14,
    fontWeight: '700',
    color: '#2D3748',
    marginBottom: 10,
  },
  gridRow: {
    flexDirection: 'row',
    backgroundColor: '#F7FAF7',
    borderRadius: 12,
    padding: 12,
    gap: 16,
  },
  gridCol: {
    flex: 1,
  },
  gridLabel: {
    fontSize: 11,
    color: '#718096',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  gridValue: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1A202C',
    marginTop: 2,
  },
  hobliBanner: {
    backgroundColor: '#E8F5E9',
    padding: 10,
    borderRadius: 10,
    marginTop: 10,
  },
  hobliBannerText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1B5E20',
  },
  fieldCircleNote: {
    fontSize: 12,
    color: '#718096',
    fontStyle: 'italic',
    marginTop: 6,
  },
  addressBox: {
    backgroundColor: '#F8F9FA',
    padding: 12,
    borderRadius: 10,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#EDF2F7',
  },
  addressLabel: {
    fontSize: 11,
    color: '#718096',
    fontWeight: '600',
  },
  addressValue: {
    fontSize: 13,
    color: '#2D3748',
    fontWeight: '600',
    marginTop: 3,
  },
  pincodeValue: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2B6CB0',
    marginTop: 4,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 18,
  },
  primaryCallBtn: {
    flex: 1,
    backgroundColor: '#2E7D32',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryCallBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  directionsBtn: {
    flex: 1,
    backgroundColor: '#E8F5E9',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#A5D6A7',
  },
  directionsBtnText: {
    color: '#1B5E20',
    fontWeight: '700',
    fontSize: 14,
  },
  officerCard: {
    backgroundColor: '#FAFAFA',
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  officerHeader: {
    marginBottom: 6,
  },
  officerDesignation: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1A202C',
  },
  officerName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4A5568',
    marginTop: 2,
  },
  officerContactRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: '#EDF2F7',
  },
  officerPhone: {
    fontSize: 13,
    fontWeight: '700',
    color: '#2B6CB0',
  },
  callSmallBtn: {
    backgroundColor: '#2E7D32',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 6,
  },
  callSmallBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 12,
  },
  noPhoneText: {
    fontSize: 11,
    color: '#A0AEC0',
    fontStyle: 'italic',
    marginTop: 4,
  },
  sourceFooter: {
    marginTop: 10,
    marginBottom: 40,
    padding: 12,
    backgroundColor: '#F7FAFC',
    borderRadius: 8,
    alignItems: 'center',
  },
  sourceFooterText: {
    fontSize: 11,
    color: '#718096',
    fontWeight: '600',
  },
  sourceLinesText: {
    fontSize: 10,
    color: '#A0AEC0',
    marginTop: 2,
  },
});
