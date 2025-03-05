import { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast'; // Corrected import path
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { useMutation, useQuery } from '@tanstack/react-query';
import axios from 'axios';

// Initialize Stripe
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY || '');

function CheckoutForm({ clientSecret, onSuccess }: { clientSecret: string; onSuccess: () => void }) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);

    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      redirect: 'if_required',
    });

    if (error) {
      toast({
        title: 'Fehler bei der Zahlung',
        description: error.message || 'Es ist ein Fehler aufgetreten.',
        variant: 'destructive',
      });
    } else if (paymentIntent && paymentIntent.status === 'succeeded') {
      // Report back to the server that payment succeeded
      try {
        await axios.post('/api/credits/payment-success', {
          paymentIntentId: paymentIntent.id,
        });
        toast({
          title: 'Zahlung erfolgreich',
          description: 'Vielen Dank für Ihren Einkauf. Die Credits wurden Ihrem Konto gutgeschrieben.',
        });
        onSuccess();
      } catch (err) {
        toast({
          title: 'Fehler',
          description: 'Die Zahlung war erfolgreich, aber die Credits konnten nicht gutgeschrieben werden. Bitte kontaktieren Sie den Support.',
          variant: 'destructive',
        });
      }
    }

    setIsProcessing(false);
  };

  return (
    <form onSubmit={handleSubmit}>
      <PaymentElement />
      <Button 
        type="submit" 
        disabled={!stripe || isProcessing} 
        className="w-full mt-4"
      >
        {isProcessing ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Wird verarbeitet...
          </>
        ) : (
          'Jetzt bezahlen'
        )}
      </Button>
    </form>
  );
}

export function PurchaseCredits() {
  const { user, refetchUser } = useAuth();
  const [selectedPackage, setSelectedPackage] = useState<string>('100');
  const [showPayment, setShowPayment] = useState(false);
  const { toast } = useToast();

  // Fetch available credit packages
  const { data: creditPackages } = useQuery({
    queryKey: ['creditPackages'],
    queryFn: async () => {
      const response = await axios.get('/api/credits/packages');
      return response.data;
    },
  });

  // Create payment intent mutation
  const createPaymentIntent = useMutation({
    mutationFn: async () => {
      const response = await axios.post('/api/credits/create-payment-intent', {
        creditPackage: selectedPackage,
      });
      return response.data;
    },
    onSuccess: () => {
      setShowPayment(true);
    },
    onError: (error) => {
      toast({
        title: 'Fehler',
        description: 'Es ist ein Fehler beim Erstellen der Zahlung aufgetreten.',
        variant: 'destructive',
      });
    },
  });

  const handleSuccess = () => {
    setShowPayment(false);
    refetchUser();
  };

  const formatPrice = (cents: number) => {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR',
    }).format(cents / 100);
  };

  if (!creditPackages) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex justify-center">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Credits kaufen</CardTitle>
        <CardDescription>
          Laden Sie Ihr Konto auf, um weitere Features zu nutzen
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {!showPayment ? (
            <>
              <div className="mb-4">
                <p className="text-sm text-muted-foreground mb-2">
                  Aktuelles Guthaben: <strong>{user?.credits} Credits</strong>
                </p>
              </div>>

              <RadioGroup 
                value={selectedPackage} 
                onValueChange={setSelectedPackage}
                className="grid grid-cols-2 gap-4"
              >
                {creditPackages && Object.entries(creditPackages).map(([credits, price]) => (
                  <div key={credits} className="flex items-center space-x-2 border rounded-md p-4 hover:border-primary cursor-pointer">
                    <RadioGroupItem value={credits} id={`credits-${credits}`} />
                    <Label htmlFor={`credits-${credits}`} className="flex-1 cursor-pointer">
                      <div className="font-medium">{credits} Credits</div>
                      <div className="text-sm text-muted-foreground">{formatPrice(price as number)}</div>
                    </Label>
                  </div>
                ))}
              </RadioGroup>>

              <div className="mt-6 text-center">
                  <p className="text-sm text-muted-foreground mb-4">
                    Wählen Sie ein Paket und fahren Sie mit der Bezahlung fort
                  </p>
                  <Button 
                    onClick={() => createPaymentIntent.mutate()} 
                    disabled={createPaymentIntent.isPending}
                    className="w-full"
                    size="lg"
                  >
                    {createPaymentIntent.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Wird geladen...
                      </>
                    ) : (
                      'Weiter zur Bezahlung'
                    )}
                  </Button>
                </div>
            </>
          ) : (
            createPaymentIntent.data?.clientSecret && (
              <Elements 
                stripe={stripePromise} 
                options={{ 
                  clientSecret: createPaymentIntent.data.clientSecret,
                  appearance: { theme: 'stripe' },
                }}
              >
                <div className="mb-6 p-4 border rounded-lg bg-muted/50">
                  <h3 className="font-medium mb-2">Ausgewähltes Paket:</h3>
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold">{selectedPackage} Credits</span>
                    <span className="text-xl">{formatPrice(createPaymentIntent.data.amount)}</span>
                  </div>
                </div>
                <CheckoutForm 
                  clientSecret={createPaymentIntent.data.clientSecret} 
                  onSuccess={handleSuccess}
                />
                <Button 
                  variant="outline" 
                  className="w-full mt-4"
                  onClick={() => setShowPayment(false)}
                >
                  Zurück zur Paketauswahl
                </Button>
              </Elements>
            )
          )}
        </div>
      </CardContent>
    </Card>
  );
}