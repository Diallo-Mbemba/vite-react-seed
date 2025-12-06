import React from 'react';
import { generateAdminDecisions } from '../utils/adminDecisions';

const TestAdminDecisions: React.FC = () => {
  const testData = {
    licence: 100000,
    fob: 1500000,
    fobVoc: 1200000,
    assurance: 10000,
    caf: 2000000,
    coefficientRevient: 1.2,
    rcp: 5000,
    rrr: 3000,
    modePaiement: 'Crédit documentaire',
    incoterm: 'CIF',
    route: 'A',
    paysFournisseur: 'FR'
  };

  const decisions = generateAdminDecisions(testData);

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Test des décisions administratives</h2>
      <div className="mb-4">
        <h3 className="font-semibold">Données de test :</h3>
        <pre className="bg-gray-100 p-2 rounded text-sm">
          {JSON.stringify(testData, null, 2)}
        </pre>
      </div>
      
      <div>
        <h3 className="font-semibold">Décisions générées ({decisions.length}) :</h3>
        {decisions.length === 0 ? (
          <p className="text-red-600">Aucune décision générée !</p>
        ) : (
          <div className="space-y-2">
            {decisions.map((decision, index) => (
              <div key={index} className="border p-2 rounded">
                <div className="font-medium">{decision.icon} {decision.title}</div>
                <div className="text-sm text-gray-600">{decision.description}</div>
                <div className="text-xs text-gray-500">Catégorie: {decision.category} | Type: {decision.type}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default TestAdminDecisions;

