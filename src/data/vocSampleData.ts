import { VOCProduct } from '../types/voc';

// Données d'exemple pour tester le système VOC
export const sampleVOCData: VOCProduct[] = [
  {
    codeSH: "1901901000",
    designation: "Préparations à base de lait contenant des matières grasses en proportion pondérale inférieure ou égale à 1,5%",
    observation: "Produit alimentaire de base",
    exempte: true
  },
  {
    codeSH: "1901902000",
    designation: "Préparations à base de lait contenant des matières grasses en proportion pondérale supérieure à 1,5%",
    observation: "Produit alimentaire transformé",
    exempte: true
  },
  {
    codeSH: "2517200000",
    designation: "Macadam de laitier, de scories ou de déchets industriels similaires",
    observation: "Matériau de construction",
    exempte: false
  },
  {
    codeSH: "6806100000",
    designation: "Laines de laitier, de scories, de roche ou de verre et mélanges de ces matières",
    observation: "Isolant thermique",
    exempte: false
  },
  {
    codeSH: "8471300000",
    designation: "Ordinateurs portables, du type dit «laptop», d'un poids n'excédant pas 10 kg",
    observation: "Équipement informatique",
    exempte: false
  },
  {
    codeSH: "8517120000",
    designation: "Téléphones mobiles, autres que les téléphones intelligents",
    observation: "Télécommunication",
    exempte: false
  },
  {
    codeSH: "8517130000",
    designation: "Téléphones intelligents",
    observation: "Télécommunication avancée",
    exempte: false
  },
  {
    codeSH: "8703230000",
    designation: "Véhicules automobiles pour le transport de personnes, cylindrée ≤ 1000 cm³",
    observation: "Véhicule léger",
    exempte: false
  },
  {
    codeSH: "8703240000",
    designation: "Véhicules automobiles pour le transport de personnes, 1000 < cylindrée ≤ 1500 cm³",
    observation: "Véhicule moyen",
    exempte: false
  },
  {
    codeSH: "8703250000",
    designation: "Véhicules automobiles pour le transport de personnes, 1500 < cylindrée ≤ 3000 cm³",
    observation: "Véhicule lourd",
    exempte: false
  }
];

// Fonction pour charger les données d'exemple dans le localStorage
export const loadSampleVOCData = () => {
  localStorage.setItem('vocProducts', JSON.stringify(sampleVOCData));
  return sampleVOCData.length;
}; 
