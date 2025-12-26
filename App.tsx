import React, { useState } from 'react';
import {
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  NativeModules,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';

const { PayUModule } = NativeModules;

// Update this to your local IP address if testing on a physical device
const API_BASE_URL = 'http://10.0.2.2:5004/api/v1/payment'; // Android emulator localhost

function App() {
  const [loading, setLoading] = useState(false);
  const [paymentResult, setPaymentResult] = useState<any>(null);

  const initiatePayment = async () => {
    try {
      setLoading(true);
      setPaymentResult(null);

      // Step 1: Initialize PayU SDK
      await PayUModule.initializePayU('4cykwl', false); // false = test mode

      // Step 2: Get payment params from backend
      const response = await fetch(`${API_BASE_URL}/initiate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: 100,
          productInfo: 'Test Product',
          firstname: 'Aditya',
          email: 'aditya@example.com',
          phone: '9999999999',
          appReferenceId: Date.now().toString(),
          surl: `${API_BASE_URL}/success`,
          furl: `${API_BASE_URL}/failure`,
        }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error('Failed to get payment params');
      }

      console.log('Payment params received:', result.data);

      // Step 3: Open PayU payment screen
      const paymentParams = {
        amount: result.data.params.amount.toString(),
        isProduction: false,
        productInfo: result.data.params.productinfo,
        key: result.data.params.key,
        phone: result.data.params.phone,
        txnid: result.data.params.txnid,
        firstname: result.data.params.firstname,
        email: result.data.params.email,
        surl: result.data.params.surl,
        furl: result.data.params.furl,
        hash: result.data.params.hash,
      };

      const paymentResponse = await PayUModule.makePayment(paymentParams);

      console.log('Payment response:', paymentResponse);
      setPaymentResult(paymentResponse);

      // Show result
      if (paymentResponse.status === 'success') {
        Alert.alert(
          'Payment Successful! 🎉',
          `Transaction ID: ${paymentResponse.txnId}\nPayment ID: ${paymentResponse.paymentId}`,
          [{ text: 'OK' }],
        );
      } else {
        Alert.alert(
          'Payment Failed',
          paymentResponse.message || 'Unknown error occurred',
          [{ text: 'OK' }],
        );
      }
    } catch (error: any) {
      console.error('Payment error:', error);
      Alert.alert('Error', error.message || 'Payment failed');
      setPaymentResult({
        status: 'error',
        message: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f5f5f5" />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.content}>
          <Text style={styles.title}>PayU UPI Payment Test</Text>
          <Text style={styles.subtitle}>Test Mode - ₹100</Text>

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={initiatePayment}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Pay Now</Text>
            )}
          </TouchableOpacity>

          {paymentResult && (
            <View style={styles.resultContainer}>
              <Text style={styles.resultTitle}>Payment Result:</Text>
              <View
                style={[
                  styles.resultBox,
                  paymentResult.status === 'success'
                    ? styles.successBox
                    : styles.errorBox,
                ]}
              >
                <Text style={styles.resultLabel}>Status:</Text>
                <Text style={styles.resultValue}>
                  {paymentResult.status?.toUpperCase()}
                </Text>

                {paymentResult.txnId && (
                  <>
                    <Text style={styles.resultLabel}>Transaction ID:</Text>
                    <Text style={styles.resultValue}>
                      {paymentResult.txnId}
                    </Text>
                  </>
                )}

                {paymentResult.paymentId && (
                  <>
                    <Text style={styles.resultLabel}>Payment ID:</Text>
                    <Text style={styles.resultValue}>
                      {paymentResult.paymentId}
                    </Text>
                  </>
                )}

                {paymentResult.message && (
                  <>
                    <Text style={styles.resultLabel}>Message:</Text>
                    <Text style={styles.resultValue}>
                      {paymentResult.message}
                    </Text>
                  </>
                )}

                {paymentResult.amount && (
                  <>
                    <Text style={styles.resultLabel}>Amount:</Text>
                    <Text style={styles.resultValue}>
                      ₹{paymentResult.amount}
                    </Text>
                  </>
                )}
              </View>
            </View>
          )}

          <View style={styles.infoContainer}>
            <Text style={styles.infoTitle}>Test Instructions:</Text>
            <Text style={styles.infoText}>
              1. Make sure your backend is running on port 5004
            </Text>
            <Text style={styles.infoText}>
              2. Click "Pay Now" to initiate payment
            </Text>
            <Text style={styles.infoText}>
              3. Select a UPI app to complete payment
            </Text>
            <Text style={styles.infoText}>
              4. Use test UPI credentials in test mode
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    color: '#666',
    textAlign: 'center',
    marginBottom: 40,
  },
  button: {
    backgroundColor: '#4CAF50',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  buttonDisabled: {
    backgroundColor: '#cccccc',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  resultContainer: {
    marginTop: 30,
  },
  resultTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  resultBox: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
  },
  successBox: {
    backgroundColor: '#E8F5E9',
    borderColor: '#4CAF50',
  },
  errorBox: {
    backgroundColor: '#FFEBEE',
    borderColor: '#F44336',
  },
  resultLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginTop: 8,
  },
  resultValue: {
    fontSize: 16,
    color: '#333',
    marginBottom: 8,
  },
  infoContainer: {
    marginTop: 40,
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#2196F3',
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    paddingLeft: 8,
  },
});

export default App;
