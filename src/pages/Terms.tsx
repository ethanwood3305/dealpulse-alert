
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

const Terms = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-grow pt-24 pb-16">
        <div className="container mx-auto px-4 md:px-6">
          <div className="max-w-3xl mx-auto">
            <h1 className="text-4xl font-bold mb-8">Terms of Service</h1>
            
            <div className="prose prose-slate dark:prose-invert max-w-none">
              <p className="lead mb-6">Last updated: {new Date().toLocaleDateString()}</p>
              
              <h2>1. Introduction</h2>
              <p>Welcome to DealPulse ("we," "our," or "us"). By accessing or using our service, you agree to be bound by these Terms of Service.</p>
              
              <h2>2. Use of Service</h2>
              <p>DealPulse provides a price monitoring platform for auto dealerships. You agree to use our service only for lawful purposes and in accordance with these Terms.</p>
              
              <h2>3. Account Registration</h2>
              <p>To use certain features of our service, you may need to register for an account. You agree to provide accurate information and to keep this information updated.</p>
              
              <h2>4. Subscription and Payment</h2>
              <p>Access to certain features requires a paid subscription. Payment terms are specified during the checkout process. Subscriptions automatically renew unless canceled before the renewal date.</p>
              
              <h2>5. Data and Privacy</h2>
              <p>Our collection and use of personal information is governed by our Privacy Policy. By using our service, you consent to our data practices as described in our Privacy Policy.</p>
              
              <h2>6. Intellectual Property</h2>
              <p>All content included in our service, such as text, graphics, logos, and software, is the property of DealPulse or its content suppliers and is protected by copyright laws.</p>
              
              <h2>7. Limitation of Liability</h2>
              <p>DealPulse shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use of or inability to use the service.</p>
              
              <h2>8. Modifications to Terms</h2>
              <p>We reserve the right to modify these Terms at any time. Continued use of the service after any such changes constitutes your acceptance of the new Terms.</p>
              
              <h2>9. Termination</h2>
              <p>We may terminate or suspend your account and access to our service immediately, without prior notice, for conduct that we believe violates these Terms or is harmful to other users, us, or third parties.</p>
              
              <h2>10. Governing Law</h2>
              <p>These Terms shall be governed by and construed in accordance with the laws of the jurisdiction in which DealPulse operates, without regard to its conflict of law provisions.</p>
              
              <h2>11. Contact Information</h2>
              <p>For questions about these Terms, please contact us via our <a href="/contact" className="text-primary hover:underline">Contact Page</a>.</p>
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default Terms;
