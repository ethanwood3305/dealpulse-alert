
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import EnterpriseContact from "@/components/EnterpriseContact";

const PricingPage = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow">
        <div className="py-20 relative">
          <div className="absolute inset-0 overflow-hidden -z-10">
            <div className="absolute bottom-1/3 right-0 w-72 h-72 bg-blue-100 rounded-full mix-blend-multiply filter blur-3xl opacity-30 dark:opacity-10"></div>
            <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-purple-100 rounded-full mix-blend-multiply filter blur-3xl opacity-30 dark:opacity-10"></div>
          </div>

          <div className="container mx-auto px-4 md:px-6">
            <div className="text-center max-w-3xl mx-auto mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Enterprise Solutions</h2>
              <p className="text-muted-foreground text-lg">
                Contact us for a tailored pricing plan that fits your business needs.
              </p>
            </div>
            
            <div className="max-w-3xl mx-auto">
              <EnterpriseContact />
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default PricingPage;
