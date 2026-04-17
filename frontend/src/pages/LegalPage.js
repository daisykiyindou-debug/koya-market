import React from 'react';
import { Link } from 'react-router-dom';

const LegalPage = ({ type }) => {
  const content = {
    cgv: {
      title: 'Conditions Générales de Vente',
      sections: [
        {
          title: '1. Objet',
          content: 'Les présentes Conditions Générales de Vente (CGV) régissent les ventes de produits effectuées par KÔYA Market sur son site internet. Toute commande implique l\'acceptation sans réserve des présentes CGV.'
        },
        {
          title: '2. Produits',
          content: 'Les produits proposés à la vente sont décrits avec la plus grande exactitude possible. KÔYA Market ne peut être tenue responsable des erreurs qui pourraient s\'y être glissées.'
        },
        {
          title: '3. Prix',
          content: 'Les prix sont indiqués en euros TTC. KÔYA Market se réserve le droit de modifier ses prix à tout moment, les produits étant facturés au prix en vigueur au moment de la commande.'
        },
        {
          title: '4. Commande',
          content: 'Le minimum de commande est fixé à 50€. La commande est confirmée par l\'envoi d\'un email de confirmation. KÔYA Market se réserve le droit d\'annuler toute commande en cas de problème de paiement ou de litige.'
        },
        {
          title: '5. Livraison',
          content: 'Les livraisons sont effectuées dans les zones couvertes par KÔYA Market (Paris et Île-de-France). Le délai de livraison est de 3 heures maximum. Les frais de livraison sont de 4,99€ pour les commandes de moins de 80€, gratuits au-delà.'
        },
        {
          title: '6. Droit de rétractation',
          content: 'Conformément à la réglementation, les produits alimentaires périssables sont exclus du droit de rétractation. Pour tout autre produit, vous disposez d\'un délai de 14 jours pour exercer votre droit de rétractation.'
        },
        {
          title: '7. Réclamations',
          content: 'Pour toute réclamation, veuillez contacter notre service client dans les 24 heures suivant la livraison via notre formulaire de contact ou par email à contact@koyamarket.com.'
        }
      ]
    },
    confidentialite: {
      title: 'Politique de Confidentialité',
      sections: [
        {
          title: '1. Collecte des données',
          content: 'KÔYA Market collecte les données personnelles nécessaires au traitement de vos commandes : nom, prénom, adresse email, adresse de livraison, numéro de téléphone.'
        },
        {
          title: '2. Utilisation des données',
          content: 'Vos données sont utilisées pour : le traitement de vos commandes, la gestion de votre compte client, l\'envoi de communications commerciales (avec votre consentement), l\'amélioration de nos services.'
        },
        {
          title: '3. Protection des données',
          content: 'Vos données sont stockées de manière sécurisée et ne sont jamais vendues à des tiers. Nous utilisons des protocoles de sécurité conformes aux standards de l\'industrie.'
        },
        {
          title: '4. Cookies',
          content: 'Notre site utilise des cookies pour améliorer votre expérience de navigation. Vous pouvez gérer vos préférences de cookies dans les paramètres de votre navigateur.'
        },
        {
          title: '5. Vos droits',
          content: 'Conformément au RGPD, vous disposez d\'un droit d\'accès, de rectification, de suppression et de portabilité de vos données. Vous pouvez exercer ces droits en nous contactant.'
        }
      ]
    },
    'mentions-legales': {
      title: 'Mentions Légales',
      sections: [
        {
          title: 'Éditeur du site',
          content: 'KÔYA Market SAS\nCapital social : [À compléter]\nSiège social : Paris, France\nRCS Paris : [À compléter]\nNuméro de TVA : [À compléter]'
        },
        {
          title: 'Directeur de publication',
          content: '[Nom du directeur de publication]'
        },
        {
          title: 'Hébergement',
          content: 'Le site est hébergé par : [Nom de l\'hébergeur]\nAdresse : [Adresse de l\'hébergeur]'
        },
        {
          title: 'Propriété intellectuelle',
          content: 'L\'ensemble du contenu du site (textes, images, logos, etc.) est protégé par le droit d\'auteur. Toute reproduction sans autorisation est interdite.'
        },
        {
          title: 'Contact',
          content: 'Pour toute question, vous pouvez nous contacter :\nEmail : contact@koyamarket.com\nTéléphone : 01 23 45 67 89'
        }
      ]
    }
  };

  const pageContent = content[type] || content.cgv;

  return (
    <div className="min-h-screen bg-background py-12">
      <div className="container-custom max-w-4xl">
        <div className="mb-8">
          <Link to="/" className="text-primary hover:underline text-sm">
            ← Retour à l'accueil
          </Link>
        </div>

        <div className="bg-white rounded-2xl p-6 md:p-10">
          <h1 className="font-heading text-3xl font-semibold mb-8">{pageContent.title}</h1>
          
          <div className="space-y-8">
            {pageContent.sections.map((section, index) => (
              <div key={index}>
                <h2 className="font-heading text-lg font-semibold mb-3">{section.title}</h2>
                <p className="text-muted-foreground whitespace-pre-line">{section.content}</p>
              </div>
            ))}
          </div>

          <div className="mt-12 pt-8 border-t text-sm text-muted-foreground">
            <p>Dernière mise à jour : Janvier 2026</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LegalPage;
