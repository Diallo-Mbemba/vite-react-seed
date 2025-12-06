import { TarifPORTProduct } from '../types/tarifport';

export const loadSampleTarifPORTData = (): TarifPORTProduct[] => {
  const sampleData: TarifPORTProduct[] = [
    {
      libelle_produit: "Droits et Taxes",
      chapitre: "01",
      tp: "DT",
      coderedevance: "DT001"
    },
    {
      libelle_produit: "Divers débours",
      chapitre: "02",
      tp: "DD",
      coderedevance: "DD001"
    },
    {
      libelle_produit: "Frais établissement FDI",
      chapitre: "03",
      tp: "FDI",
      coderedevance: "FDI001"
    },
    {
      libelle_produit: "Frais RFCV",
      chapitre: "04",
      tp: "RFCV",
      coderedevance: "RFCV001"
    },
    {
      libelle_produit: "Redevance portuaire",
      chapitre: "05",
      tp: "RP",
      coderedevance: "RP001"
    },
    {
      libelle_produit: "Redevance Municipale",
      chapitre: "06",
      tp: "RM",
      coderedevance: "RM001"
    },
    {
      libelle_produit: "Acconage Import TEU",
      chapitre: "07",
      tp: "AIT",
      coderedevance: "AIT001"
    },
    {
      libelle_produit: "Livraison_TEU",
      chapitre: "08",
      tp: "LTEU",
      coderedevance: "LTEU001"
    },
    {
      libelle_produit: "Relevage_TEU",
      chapitre: "09",
      tp: "RTEU",
      coderedevance: "RTEU001"
    },
    {
      libelle_produit: "Divers_Debours",
      chapitre: "10",
      tp: "DD2",
      coderedevance: "DD002"
    },
    {
      libelle_produit: "Echange BL",
      chapitre: "11",
      tp: "EBL",
      coderedevance: "EBL001"
    },
    {
      libelle_produit: "Nettoyage_TC_TEU",
      chapitre: "12",
      tp: "NTC",
      coderedevance: "NTC001"
    },
    {
      libelle_produit: "Taxe ISPS",
      chapitre: "13",
      tp: "ISPS",
      coderedevance: "ISPS001"
    },
    {
      libelle_produit: "Scanner",
      chapitre: "14",
      tp: "SCAN",
      coderedevance: "SCAN001"
    },
    {
      libelle_produit: "Timbre sur BL",
      chapitre: "15",
      tp: "TSBL",
      coderedevance: "TSBL001"
    },
    {
      libelle_produit: "Conteneur_Service_Charge_CSC",
      chapitre: "16",
      tp: "CSC",
      coderedevance: "CSC001"
    },
    {
      libelle_produit: "Ouverture dossier",
      chapitre: "17",
      tp: "OD",
      coderedevance: "OD001"
    },
    {
      libelle_produit: "Total_Intervention",
      chapitre: "18",
      tp: "TI",
      coderedevance: "TI001"
    },
    {
      libelle_produit: "Commission sur avance de Fond",
      chapitre: "19",
      tp: "CAF",
      coderedevance: "CAF001"
    },
    {
      libelle_produit: "Imprimer et Faxe",
      chapitre: "20",
      tp: "IF",
      coderedevance: "IF001"
    },
    {
      libelle_produit: "Commission Transit",
      chapitre: "21",
      tp: "CT",
      coderedevance: "CT001"
    },
    {
      libelle_produit: "Taxe Sydam",
      chapitre: "22",
      tp: "SYDAM",
      coderedevance: "SYDAM001"
    },
    {
      libelle_produit: "HAD",
      chapitre: "23",
      tp: "HAD",
      coderedevance: "HAD001"
    },
    {
      libelle_produit: "HAD Frais fixe",
      chapitre: "24",
      tp: "HADFF",
      coderedevance: "HADFF001"
    },
    {
      libelle_produit: "Total prestation",
      chapitre: "25",
      tp: "TP",
      coderedevance: "TP001"
    }
  ];

  localStorage.setItem('tarifportProducts', JSON.stringify(sampleData));
  return sampleData;
}; 
