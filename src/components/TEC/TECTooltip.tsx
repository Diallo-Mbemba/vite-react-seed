import React from 'react';
import { TECArticle } from '../../types/tec';

interface TECTooltipProps {
  article: TECArticle | null;
  isVisible: boolean;
  position: { x: number; y: number };
}

const TECTooltip: React.FC<TECTooltipProps> = ({ article, isVisible, position }) => {
  if (!isVisible || !article) return null;

  const formatPercentage = (value: number) => {
    return value > 0 ? `${value.toFixed(2)}%` : '-';
  };

  return (
    <div
      className="fixed z-50 bg-white border border-gray-300 rounded-lg shadow-lg p-4 max-w-lg"
      style={{
        left: position.x + 10,
        top: position.y - 10,
        transform: 'translateY(-100%)'
      }}
    >
      {/* En-tête avec codes */}
      <div className="mb-3 pb-2 border-b border-gray-200">
        <div className="flex justify-between items-center mb-1">
          <div className="font-bold text-cote-ivoire-primary text-lg">
            {article.sh10Code}
          </div>
          <div className="text-sm text-gray-600">
            {article.sh6Code}
          </div>
        </div>
        <div className="text-sm text-gray-600">
          Unité: {article.us}
        </div>
      </div>

      {/* Désignation en exergue */}
      <div className="mb-4 p-3 bg-cote-ivoire-primary/10 border border-cote-ivoire-primary/20 rounded-lg">
        <div className="text-xs text-cote-ivoire-primary font-semibold mb-1">DÉSIGNATION DU PRODUIT</div>
        <div className="text-sm text-gray-900 leading-tight font-medium">
          {article.designation}
        </div>
      </div>

      {/* Taux principaux */}
      <div className="mb-3">
        <div className="text-xs text-gray-500 mb-2 font-semibold">TAUX PRINCIPAUX</div>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">DD:</span>
            <span className="font-medium text-green-600">{formatPercentage(article.dd)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">RSTA:</span>
            <span className="font-medium text-green-600">{formatPercentage(article.rsta)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">TVA:</span>
            <span className="font-medium text-green-600">{formatPercentage(article.tva)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Cumul A/TVA:</span>
            <span className="font-medium text-green-600">{formatPercentage(article.cumulAvecTVA)}</span>
          </div>
        </div>
      </div>

      {/* Taux détaillés */}
      <div className="mb-3">
        <div className="text-xs text-gray-500 mb-2 font-semibold">TAUX DÉTAILLÉS</div>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">PCS:</span>
            <span className="font-medium text-blue-600">{formatPercentage(article.pcs)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">PUA:</span>
            <span className="font-medium text-blue-600">{formatPercentage(article.pua)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">PCC:</span>
            <span className="font-medium text-blue-600">{formatPercentage(article.pcc)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Cumul S/TVA:</span>
            <span className="font-medium text-blue-600">{formatPercentage(article.cumulSansTVA)}</span>
          </div>
        </div>
      </div>

      {/* Codes spéciaux - Première ligne */}
      <div className="mb-2">
        <div className="text-xs text-gray-500 mb-2 font-semibold">CODES SPÉCIAUX</div>
        <div className="grid grid-cols-3 gap-2 text-xs">
          <div className="flex justify-between">
            <span className="text-gray-600">TUB:</span>
            <span className="font-medium">{article.tub || '-'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">DUS:</span>
            <span className="font-medium">{article.dus || '-'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">DUD:</span>
            <span className="font-medium">{article.dud || '-'}</span>
          </div>
        </div>
      </div>

      {/* Codes spéciaux - Deuxième ligne */}
      <div className="mb-2">
        <div className="grid grid-cols-3 gap-2 text-xs">
          <div className="flex justify-between">
            <span className="text-gray-600">TCB:</span>
            <span className="font-medium">{article.tcb || '-'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">TSM:</span>
            <span className="font-medium">{article.tsm || '-'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">TSB:</span>
            <span className="font-medium">{article.tsb || '-'}</span>
          </div>
        </div>
      </div>

      {/* Codes spéciaux - Troisième ligne */}
      <div className="mb-2">
        <div className="grid grid-cols-3 gap-2 text-xs">
          <div className="flex justify-between">
            <span className="text-gray-600">PSV:</span>
            <span className="font-medium">{article.psv || '-'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">TAI:</span>
            <span className="font-medium">{article.tai || '-'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">TAB:</span>
            <span className="font-medium">{article.tab || '-'}</span>
          </div>
        </div>
      </div>

      {/* Codes spéciaux - Quatrième ligne */}
      <div className="mb-2">
        <div className="grid grid-cols-3 gap-2 text-xs">
          <div className="flex justify-between">
            <span className="text-gray-600">TUF:</span>
            <span className="font-medium">{article.tuf || '-'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">RRR:</span>
            <span className="font-medium text-blue-600">{formatPercentage(article.rrr)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">RCP:</span>
            <span className="font-medium text-blue-600">{formatPercentage(article.rcp)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TECTooltip; 
