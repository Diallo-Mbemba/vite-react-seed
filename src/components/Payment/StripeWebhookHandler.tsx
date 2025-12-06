import React, { useEffect, useState } from 'react';
import { CheckCircle, XCircle, AlertCircle, Clock } from 'lucide-react';
import { processWebhookEvent, WebhookEvent } from '../../utils/stripeWebhooks';

interface WebhookHandlerProps {
  event: WebhookEvent;
  onProcessed?: (success: boolean) => void;
}

const StripeWebhookHandler: React.FC<WebhookHandlerProps> = ({ event, onProcessed }) => {
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleWebhook = async () => {
      try {
        setStatus('processing');
        const success = await processWebhookEvent(event);
        
        if (success) {
          setStatus('success');
        } else {
          setStatus('error');
          setError('Erreur lors du traitement du webhook');
        }
      } catch (err) {
        setStatus('error');
        setError(err instanceof Error ? err.message : 'Erreur inconnue');
      } finally {
        onProcessed?.(status === 'success');
      }
    };

    handleWebhook();
  }, [event, onProcessed]);

  const getStatusIcon = () => {
    switch (status) {
      case 'processing':
        return <Clock className="h-5 w-5 text-yellow-500 animate-spin" />;
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'error':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <AlertCircle className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'processing':
        return 'Traitement en cours...';
      case 'success':
        return 'Webhook traité avec succès';
      case 'error':
        return 'Erreur lors du traitement';
      default:
        return 'Statut inconnu';
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'processing':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'success':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'error':
        return 'text-red-600 bg-red-50 border-red-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  return (
    <div className={`p-4 rounded-lg border ${getStatusColor()}`}>
      <div className="flex items-center space-x-3">
        {getStatusIcon()}
        <div className="flex-1">
          <h3 className="font-medium">{getStatusText()}</h3>
          <p className="text-sm opacity-75">
            Événement: {event.type} (ID: {event.id})
          </p>
          {error && (
            <p className="text-sm mt-1 text-red-600">
              Erreur: {error}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default StripeWebhookHandler;

