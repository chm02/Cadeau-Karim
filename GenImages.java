import java.text.Normalizer;
import java.util.*;

public class GenImages {

    static String slug(String name) {
        String s = Normalizer.normalize(name, Normalizer.Form.NFD)
                .replaceAll("\\p{InCombiningDiacriticalMarks}+", "")
                .toLowerCase(Locale.ROOT)
                .replaceAll("[^a-z0-9]+", "-")
                .replaceAll("^-+|-+$", "");
        return s + ".jpg";
    }

    public static void main(String[] args) {
        List<String> products = new ArrayList<>();

        // 1) Produits Laitiers & Oeufs
        products.add("Lait UHT Demi-Écrémé Centrale 1L");
        products.add("Lait UHT Entier Centrale 1L");
        products.add("Lait UHT Écrémé Centrale 1L");
        products.add("Lait UHT Demi-Écrémé Centrale 6x1L (Pack)");
        products.add("Lait UHT Entier Centrale 6x1L (Pack)");
        products.add("Lait UHT Demi-Écrémé Jaouda 1L");
        products.add("Lait UHT Entier Jaouda 1L");
        products.add("Lait UHT Demi-Écrémé Jaouda 6x1L (Pack)");
        products.add("Lait Fermenté Lben Centrale 500ml");
        products.add("Lait Fermenté Lben Centrale 1L");
        products.add("Lait Fermenté Lben Jaouda 500ml");
        products.add("Lait Fermenté Lben Jaouda 1L");
        products.add("Lait UHT Chocolaté Centrale 1L");
        products.add("Lait UHT Chocolaté Jaouda 1L");
        products.add("Lait UHT Vanille Centrale 20cl");
        products.add("Lait UHT Vanille Centrale 500ml");
        products.add("Lait UHT Fraise Centrale 20cl");
        products.add("Lait UHT Fraise Centrale 500ml");
        products.add("Lait UHT Chocolat Centrale 20cl (Briquette)");
        products.add("Lait en Poudre Gloria 400g");
        products.add("Lait en Poudre Gloria 900g");
        products.add("Lait en Poudre Gloria 2.25kg");
        products.add("Lait en Poudre Nido 400g");
        products.add("Lait en Poudre Nido 900g");
        products.add("Lait en Poudre Nido 2.25kg");
        String[] yaourtSaveurs = {"Vanille", "Fraise", "Pêche", "Abricot", "Nature", "Coco", "Miel"};
        for (String s : yaourtSaveurs) {
            products.add("Yaourt Danone " + s + " (Pot 125g)");
            products.add("Yaourt Centrale " + s + " (Pot 125g)");
        }
        products.add("Yaourt Danone Vanille Pack 4x125g");
        products.add("Yaourt Danone Fraise Pack 4x125g");
        products.add("Yaourt à Grecque Centrale Nature 150g");
        products.add("Yaourt à Grecque Centrale Miel 150g");
        products.add("Petit Suisse Danone 6x60g");
        products.add("Beurre de Table Centrale 250g");
        products.add("Beurre de Table Centrale 500g");
        products.add("Beurre de Table Centrale 1kg");
        products.add("Beurre Beldi 250g");
        products.add("Beurre Beldi 500g");
        products.add("Beurre Beldi 1kg");
        products.add("Beurre de Cuisine Président 250g");
        products.add("Beurre de Cuisine Centurion 250g");
        products.add("Beurre de Cuisine Président 500g");
        products.add("Beurre de Cuisine Centurion 500g");
        products.add("Beurre Clarifié (Smen) 500g");
        products.add("Beurre Clarifié (Smen) 1kg");
        products.add("Crème Fraîche Cuisine Centrale 20cl");
        products.add("Crème Fraîche Cuisine Centrale 50cl");
        products.add("Crème Fraîche Liquide Entière 20cl");
        products.add("Crème Fraîche Liquide Entière 50cl");
        products.add("Crème Fleurette 20cl");
        products.add("Chantilly Spray Président 250g");
        products.add("Fromage La Vache qui Rit 8 Portions");
        products.add("Fromage La Vache qui Rit 16 Portions");
        products.add("Fromage La Vache qui Rit 24 Portions");
        products.add("Fromage La Vache qui Rit 32 Portions");
        products.add("Fromage Les Enfants 8 Portions");
        products.add("Fromage Les Enfants 16 Portions");
        products.add("Fromage Président 8 Portions");
        products.add("Fromage Président 16 Portions");
        products.add("Fromage Kiri 6 Portions");
        products.add("Fromage Kiri 12 Portions");
        products.add("Fromage Kiri 24 Portions");
        products.add("Fromage Carré Frais 6 Portions");
        products.add("Fromage Carré Frais 12 Portions");
        products.add("Fromage Gouda Tafilelt Bloc 250g");
        products.add("Fromage Gouda Tafilelt Bloc 400g");
        products.add("Fromage Gouda Président Bloc 200g");
        products.add("Fromage Edam Graindorge 200g");
        products.add("Fromage Edam Graindorge 400g");
        products.add("Fromage Gouda Tranches Tafilelt 200g");
        products.add("Fromage Mozzarella Râpée Galbani 200g");
        products.add("Fromage Mozzarella Râpée Galbani 400g");
        products.add("Fromage Mozzarella Râpée Président 200g");
        products.add("Fromage Mozzarella Râpée Safilait 200g");
        products.add("Fromage Mozzarella Râpée Safilait 1kg");
        products.add("Fromage Emmental Râpé Président 200g");
        products.add("Fromage Emmental Râpé 400g");
        products.add("Fromage Cheddar Tranches Sandwich 200g");
        products.add("Fromage Cheddar Tranches Sandwich 400g");
        products.add("Boîte de 6 Œufs Frais Calibre M");
        products.add("Boîte de 12 Œufs Frais Calibre M");
        products.add("Boîte de 12 Œufs Frais Calibre L");
        products.add("Plateau de 30 Œufs Frais Calibre S");
        products.add("Plateau de 30 Œufs Frais Calibre M");
        products.add("Plateau de 30 Œufs Frais Calibre L");
        products.add("Plateau de 30 Œufs Label Rouge");

        // 2) Épicerie Salée & Conserves
        String[] formatsPates = {"500g", "1kg"};
        String[] typesPates = {"Spaghettis", "Macaroni", "Penne", "Coquillettes", "Tagliatelles", "Lasagnes", "Vermicelles"};
        String[] marquesPates = {"Rima", "Dari", "Fandy", "Tria"};
        for (String marque : marquesPates) {
            for (String type : typesPates) {
                for (String fmt : formatsPates) {
                    products.add("Pâtes " + marque + " " + type + " " + fmt);
                }
            }
        }
        for (String m : new String[]{"Rima", "Dari", "Fandy"}) {
            products.add("Pâtes " + m + " Vermicelles 250g");
        }
        String[] couscousTypes = {"Fin", "Moyen", "Complet", "Maïs"};
        String[] couscousFormats = {"1kg", "2kg", "5kg"};
        for (String m : new String[]{"Dari", "Fandy"}) {
            for (String t : couscousTypes) {
                for (String fmt : couscousFormats) {
                    products.add("Couscous " + t + " " + m + " " + fmt);
                }
            }
        }
        products.add("Pâte à Pizza Hida 300g (Frais)");
        products.add("Pâte à Pizza Carrefour 300g (Frais)");
        products.add("Pâte à Pizza Artisanale 400g");
        products.add("Pâte Feuilletée Rouleau 270g");
        products.add("Pâte Feuilletée Rouleau Pur Beurre 270g");
        products.add("Pâte Brisée Rouleau 280g");
        products.add("Pâte à Pizza Surgelée 400g");
        products.add("Pâte Brisée Surgelée 400g");
        products.add("Riz Rond Rima 1kg"); products.add("Riz Rond Rima 5kg");
        products.add("Riz Rond Dari 1kg"); products.add("Riz Rond Dari 5kg");
        products.add("Riz Basmati 1kg"); products.add("Riz Basmati 5kg");
        products.add("Riz Long Parfumé 1kg"); products.add("Riz Long Parfumé 5kg");
        products.add("Riz Thaï 1kg"); products.add("Riz Camolino 1kg");
        products.add("Pois Chiches Secs 1kg"); products.add("Pois Chiches Secs 5kg");
        products.add("Lentilles Vertes 1kg"); products.add("Lentilles Corail 1kg");
        products.add("Lentilles Vertes 5kg"); products.add("Haricots Blancs 1kg");
        products.add("Haricots Rouges 1kg"); products.add("Fèves Sèches 1kg");
        products.add("Fèves Sèches 5kg");
        for (String m : new String[]{"Fandy", "Maymouna", "Tria"}) {
            products.add("Farine de Blé Tendre " + m + " 1kg");
            products.add("Farine de Blé Tendre " + m + " 2kg");
            products.add("Farine de Blé Tendre " + m + " 5kg");
            products.add("Farine de Blé Tendre " + m + " 10kg");
            products.add("Semoule Fine Blé Dur " + m + " 1kg");
            products.add("Semoule Moyenne Blé Dur " + m + " 1kg");
        }
        products.add("Semoule de Maïs 1kg"); products.add("Farine de Maïs 1kg");
        products.add("Maïzena (Fécule) 500g"); products.add("Maïzena (Fécule) 1kg");
        for (String fmt : new String[]{"1L", "2L", "3L", "5L"}) {
            products.add("Huile de Table Lesieur " + fmt);
            products.add("Huile Afia " + fmt);
            products.add("Huile Tournesol Hala " + fmt);
            products.add("Huile Tournesol Cristal " + fmt);
        }
        products.add("Huile d'Olive Extra Vierge Lesieur 1L");
        products.add("Huile d'Olive Extra Vierge Lesieur 2L");
        products.add("Huile d'Olive Oued Souss 1L");
        products.add("Huile d'Olive Oued Souss 2L");
        products.add("Huile d'Olive Terroir du Maroc 1L");
        products.add("Huile d'Olive Vierge 75cl");
        products.add("Huile d'Argan Alimentaire 250ml");
        products.add("Vinaigre Blanc Cristal 50cl"); products.add("Vinaigre Blanc Cristal 1L");
        products.add("Vinaigre de Cidre 50cl"); products.add("Vinaigre de Cidre 1L");
        products.add("Vinaigre Balsamique 50cl");
        products.add("Sel Fin Blanc Lesieur 1kg"); products.add("Sel Fin Blanc Lesieur 2kg");
        products.add("Sel Gros Cristallin 1kg"); products.add("Sel Gris de Mer 1kg");
        products.add("Poivre Noir Moulu 100g"); products.add("Poivre Noir en Grains 100g");
        products.add("Concentré de Tomates Aïcha Tube 200g");
        products.add("Concentré de Tomates Aïcha Boîte 400g");
        products.add("Concentré de Tomates Aïcha Boîte 800g");
        products.add("Concentré de Tomates Aïcha Boîte 2.5kg");
        products.add("Concentré de Tomates Koutoubia 400g");
        products.add("Concentré de Tomates Koutoubia 800g");
        products.add("Concentré de Tomates Double Concentré 400g");
        products.add("Sauce Tomate Cuisinée Aïcha Brique 500g");
        products.add("Sauce Tomate Cuisinée Rima Brique 500g");
        products.add("Sauce Tomate Bolognese Préparée 500g");
        products.add("Sauce Tomate Napolitaine Préparée 500g");
        products.add("Ketchup Heinz Flacon 300g"); products.add("Ketchup Heinz Flacon 500g");
        products.add("Ketchup Aïcha Flacon 300g"); products.add("Ketchup Aïcha Flacon 500g");
        products.add("Mayonnaise Lesieur Flacon 300g"); products.add("Mayonnaise Lesieur Flacon 500g");
        products.add("Mayonnaise Aïcha Flacon 300g"); products.add("Mayonnaise Aïcha Flacon 500g");
        products.add("Mayonnaise Dijonnaise Flacon 300g");
        products.add("Moutarde Forte Flacon 250g"); products.add("Moutarde Douce Flacon 250g");
        products.add("Moutarde de Dijon Flacon 250g");
        products.add("Sauce Barbecue Flacon 300g"); products.add("Sauce Algérienne Flacon 300g");
        products.add("Harissa Le Phare du Cap Bon Tube 70g");
        products.add("Harissa Le Phare du Cap Bon Boîte 380g");
        products.add("Harissa Aïcha Tube 70g"); products.add("Harissa Aïcha Boîte 380g");
        products.add("Harissa Aïcha Boîte 760g");
        String[] epices = {"Cumin","Paprika","Gingembre","Curcuma","Cannelle","Coriandre","Noix de Muscade","Ras el Hanout","Mélange Couscous","Zaatar","Mélange Grillades","Ail en Poudre","Oignon en Poudre"};
        for (String e : epices) {
            products.add("Épice " + e + " (Sachet 100g)");
            products.add("Épice " + e + " (Bocal 250g)");
        }
        String[] varietesThon = {"À l'huile de tournesol", "À l'huile d'olive", "Au naturel", "Piments"};
        for (String v : varietesThon) {
            products.add("Thon Tom Ton " + v + " 80g");
            products.add("Thon Tom Ton " + v + " 160g");
            products.add("Thon Aloes " + v + " 80g");
            products.add("Thon Aloes " + v + " 160g");
            products.add("Thon Anny " + v + " 80g (Lot de 3)");
            products.add("Thon Anny " + v + " 160g (Lot de 3)");
        }
        products.add("Sardines Anny à l'huile 120g"); products.add("Sardines Anny au piment 120g");
        products.add("Sardines Anny à la tomate 120g"); products.add("Sardines Walima à l'huile 120g");
        products.add("Sardines Walima au piment 120g"); products.add("Sardines Titus à l'huile 120g");
        products.add("Sardines Anny Grillées 120g (Lot de 3)");
        products.add("Maquereaux à la Sauce Tomate 120g");
        products.add("Crevettes Roses Décortiquées Surgelées 200g");
        products.add("Champignons de Paris Entiers Boîte 400g");
        products.add("Champignons de Paris Émincés Boîte 400g");
        products.add("Maïs Doux Géant Boîte 300g (Lot de 2)");
        products.add("Maïs Doux Bonduelle Boîte 300g (Lot de 3)");
        products.add("Petits Pois et Carottes Bonduelle 400g");
        products.add("Petits Pois Fins Bonduelle 400g");
        products.add("Haricots Verts Beurre Bonduelle 400g");
        products.add("Haricots Verts Mince Bonduelle 400g");
        products.add("Coeurs de Palmier Boîte 400g");
        products.add("Coeurs de Palmier Miniatures Boîte 230g");
        products.add("Olives Vertes Dénoyautées Bocal 700g");
        products.add("Olives Noires Dénoyautées Bocal 700g");
        products.add("Olives Violettes Farcies Poivron Bocal 700g");
        products.add("Câpres Bocal 200g"); products.add("Cornichons Aigres-Doux Bocal 370g");
        products.add("Onions au Vinaigre Bocal 370g");
        products.add("Lentilles Préparées Boîte 500g"); products.add("Pois Chiches Préparés Boîte 500g");
        products.add("Artichauts demi-fonds Bocal 380g");
        products.add("Poivrons Grillés à l'huile Bocal 480g");
        products.add("Tahini (Crème de Sésame) 500g"); products.add("Tahini (Crème de Sésame) 1kg");
        products.add("Pâte de Sésame Noire 500g"); products.add("Mloukhia en Feuilles Séchées 200g");
        products.add("Safran en Poudre (1g)"); products.add("Eau de Fleur d'Oranger Bocal 250ml");
        products.add("Eau de Rose Bocal 250ml"); products.add("Bicarbonate Alimentaire 200g");
        products.add("Levure Chimique Sachet 10g"); products.add("Levure de Boulanger Séchée 500g");
        products.add("Gélatine Alimentaire Sachet 10g");

        // 3) Charcuterie Halal
        String[] marquesCha = {"Koutoubia", "Alfassia", "Dinar", "Isla Mondial"};
        String[] formatsCha = {"200g", "400g", "1kg"};
        for (String marque : marquesCha) {
            for (String fmt : formatsCha) {
                products.add("Cacher (Jambon) de Dinde " + marque + " " + fmt);
                products.add("Cacher de Bœuf " + marque + " " + fmt);
                products.add("Cacher aux Olives Dinde " + marque + " " + fmt);
                products.add("Cacher aux Poivrons Dinde " + marque + " " + fmt);
            }
        }
        for (String m : marquesCha) {
            products.add("Salami de Dinde Tranché " + m + " 200g");
            products.add("Salami de Bœuf Tranché " + m + " 200g");
            products.add("Mortadelle Supérieure Classique " + m + " 200g");
            products.add("Mortadelle aux Olives " + m + " 200g");
            products.add("Mortadelle aux Piments " + m + " 200g");
            products.add("Mortadelle aux Pistaches " + m + " 200g");
            products.add("Blanc de Dinde Fumé Tranché " + m + " 200g");
            products.add("Bacon de Dinde Fumé Tranché " + m + " 200g");
        }
        products.add("Merguez de Bœuf Barquette 500g"); products.add("Merguez de Bœuf Barquette 1kg");
        products.add("Saucisses de Dinde Barquette 500g");
        products.add("Kefta de Bœuf Préparé Barquette 500g");
        products.add("Rôti de Dinde Cuit Entier 1kg");
        products.add("Pâté de Dinde Cuisiné 200g"); products.add("Terrine Campagnarde 200g");

        // 4) Bébé & Puériculture
        String[] taillesCouche = {"1","2","3","4","5","6"};
        for (String t : taillesCouche) {
            products.add("Couches Pampers Active Baby Taille " + t + " (Paquet x44)");
            products.add("Couches Pampers Active Baby Taille " + t + " (Méga Pack x88)");
            products.add("Couches Pampers Baby-Dry Taille " + t + " (Paquet x46)");
        }
        for (String t : taillesCouche) products.add("Couches Huggies Ultra Taille " + t + " (Paquet x42)");
        for (String t : taillesCouche) {
            products.add("Couches Dalaa Taille " + t + " (Paquet x48)");
            products.add("Couches Molped Taille " + t + " (Paquet x48)");
            products.add("Couches Babylino Taille " + t + " (Paquet x48)");
        }
        products.add("Couches de Bain Pampers Splashers Taille 3-4 (Paquet x12)");
        products.add("Couches de Bain Huggies Little Swimmers Taille 3-4 (x12)");
        products.add("Lingettes Bébé Douceur Paquet x56"); products.add("Lingettes Bébé Douceur Paquet x72");
        products.add("Lingettes Pampers Sensitive Paquet x56"); products.add("Lingettes Pampers Sensitive Paquet x72");
        products.add("Lingettes Pampers Paquet x72 (Lot de 3)");
        products.add("Lingettes Huggies Natural Paquet x56"); products.add("Lingettes Bébé Eau Pure Paquet x64");
        products.add("Lait 1er Âge Guigoz 800g"); products.add("Lait 2ème Âge Guigoz 800g");
        products.add("Lait 3ème Âge Guigoz 800g"); products.add("Lait 1er Âge Novalac 800g");
        products.add("Lait 2ème Âge Novalac 800g"); products.add("Lait 1er Âge NAN Optipro 800g");
        products.add("Lait 2ème Âge NAN Optipro 800g"); products.add("Lait 3ème Âge NAN 800g");
        products.add("Lait 1er Âge Gallia 800g"); products.add("Lait 2ème Âge Gallia 800g");
        products.add("Lait Anti-Régurgitation Novalac AR 800g");
        products.add("Lait Confort Novalac Coliques 800g");
        for (String parf : new String[]{"Biscuit","Miel","Blé","5 Céréales","Fruits"}) {
            products.add("Farine Lactée Nestlé Cerelac " + parf + " 400g");
            products.add("Farine Lactée Nestlé Cerelac " + parf + " 1kg");
        }
        for (String parf : new String[]{"Pomme","Poire","Pêche","Carottes","Petits Pois","Poulet Légumes","Bœuf Légumes"}) {
            products.add("Petit Pot Bébé Nestlé " + parf + " 130g");
            products.add("Petit Pot Bébé Guigoz " + parf + " 130g");
        }
        products.add("Lait de Toilette Bébé Johnson's 500ml");
        products.add("Shampooing Doux Bébé Johnson's 500ml");
        products.add("Gel Lavant Corps & Cheveux Johnson's 500ml");
        products.add("Shampooing Doux Mustela Bébé 500ml");
        products.add("Gel Lavant Mustela à l'Avocat 500ml");
        products.add("Crème Change Mustela 123 100ml"); products.add("Crème Change Bébé 1-2-3 100g");
        products.add("Talc Bébé Johnson's 400g"); products.add("Talc Bébé Naturel 400g");
        products.add("Huile de Massage Bébé 250ml");
        products.add("Biberon Nuk Anti-Colique 250ml"); products.add("Biberon Nuk Anti-Colique 300ml");
        products.add("Tétine Nuk Taille 1 (Lot de 2)"); products.add("Tétine Nuk Taille 2 (Lot de 2)");
        products.add("Aspirateur Nasal pour Bébé"); products.add("Thermomètre Baignoire Bébé");
        products.add("Thermomètre Frontal Infrarouge Bébé");
        products.add("Brosse à Cheveux et Peigne Bébé");
        products.add("Cotons-Tiges Bébé (Boîte x200)");
        products.add("Carrés de Coton Bébé (Paquet x100)");
        products.add("Compresses Stériles x20");
        products.add("Sucette Orthodontique (Lot de 2)");
        products.add("Anneau de Dentition Réfrigérant");

        // 5) Boissons & Eaux
        String[] formatsEau = {"33cl (Pack x24)", "50cl (Pack x24)", "1.5L (Pack x6)", "5L"};
        for (String m : new String[]{"Sidi Ali", "Aïn Saïss", "Bahia"}) {
            for (String fmt : formatsEau) {
                products.add("Eau Minérale " + m + " " + fmt);
            }
        }
        products.add("Eau Minérale Sidi Ali 1.5L (Unité)");
        products.add("Eau Minérale Aïn Saïss 1.5L (Unité)");
        products.add("Eau Minérale Bahia 1.5L (Unité)");
        products.add("Eau Gazeuse Oulmès 50cl"); products.add("Eau Gazeuse Oulmès 1L");
        products.add("Eau Gazeuse Oulmès 1L (Pack x6)");
        products.add("Eau Gazeuse San Pellegrino 50cl");
        products.add("Eau Pétillante Naturelle Badoit 50cl");
        for (String saveur : new String[]{"Original", "Zero", "Light"}) {
            products.add("Coca-Cola " + saveur + " Canette 33cl (Lot de 6)");
            products.add("Coca-Cola " + saveur + " Canette 33cl (Pack x24)");
        }
        for (String fmt : new String[]{"1L", "1.5L", "2L"}) {
            products.add("Coca-Cola Original Bouteille " + fmt);
            products.add("Coca-Cola Zero Bouteille " + fmt);
            products.add("Fanta Orange Bouteille " + fmt);
            products.add("Fanta Citron Bouteille " + fmt);
            products.add("Sprite Bouteille " + fmt);
            products.add("Orangina Bouteille " + fmt);
            products.add("Schweppes Agrum' Bouteille " + fmt);
            products.add("Schweppes Tonic Bouteille " + fmt);
            products.add("Schweppes Lemon Bouteille " + fmt);
            products.add("Hawaï Ananas Bouteille " + fmt);
            products.add("Pampsin Pamplemousse Bouteille " + fmt);
            products.add("Mountain Dew Bouteille " + fmt);
        }
        products.add("Fayrouz Ananas Bouteille 33cl"); products.add("Fayrouz Pêche Bouteille 33cl");
        products.add("Fayrouz Ananas 1L"); products.add("Fayrouz Pêche 1L");
        products.add("Boisson Tropicale Teisseire 1L");
        for (String saveur : new String[]{"Orange","Pomme","Multivitaminé","Ananas","Pamplemousse","Raisin","Abricot","Pêche","Tomate"}) {
            products.add("Jus Marrakech 100% Pressé " + saveur + " 1L");
            products.add("Nectar Marrakech " + saveur + " 1L");
            products.add("Jus Oasis " + saveur + " 1L");
            products.add("Jus Top Fruit " + saveur + " 1L");
        }
        for (String saveur : new String[]{"Orange","Pomme","Multivitaminé"}) {
            products.add("Jus Marrakech " + saveur + " Briquette 20cl (Pack x6)");
        }
        products.add("Lait UHT Chocolat Centrale Briquette 20cl (Pack x6)");
        products.add("Lait UHT Chocolat Jaouda Briquette 20cl (Pack x6)");
        products.add("Lait UHT Fraise Jaouda Briquette 20cl (Pack x6)");
        products.add("Sirop de Menthe Teisseire 75cl"); products.add("Sirop de Grenadine Teisseire 75cl");
        products.add("Sirop d'Orange Teisseire 75cl"); products.add("Sirop Fraise Teisseire 75cl");
        products.add("Sirop Pamplemousse Rose Teisseire 75cl");
        products.add("Sirop de Chicorée Liquide 75cl"); products.add("Limonade Lorina Citron 1L");
        products.add("Ice Thé Pêche Lipton 1L"); products.add("Ice Thé Citron Lipton 1L");
        products.add("Ice Thé Pêche Fuze Tea 1L");
        products.add("Boisson Énergisante Red Bull 250ml");
        products.add("Boisson Énergisante Red Bull 250ml (Lot de 4)");
        products.add("Boisson Énergisante Monster 500ml");
        products.add("Boisson Énergisante Burn 500ml");
        products.add("Starbucks Frappuccino Mocha 280ml");
        products.add("Starbucks Frappuccino Caramel 280ml");

        // 6) Biscuits, Chocolats & Snacking
        for (String b : new String[]{"Merendina Chocolat","Merendina Fraise","Merendina Vanille","Timeout","Tonik","Krakatou","Golden","Golden Familial","Pacha","Panini","Tagger","Mirienda","Petit Beurre","Maria","Spéculoos","Chocolatine","Sable Chocolat","Nappée Chocolat"}) {
            products.add("Biscuit Bimo " + b + " (Paquet individuel)");
            products.add("Biscuit Bimo " + b + " (Paquet familial 250g)");
            products.add("Biscuit Bimo " + b + " (Grand format 500g)");
        }
        products.add("Cookies Casino Pépites de Chocolat 120g");
        products.add("Cookies Casino Double Chocolat 120g");
        products.add("Cookies Casino Pépites de Chocolat 300g");
        products.add("Sablés Pur Beurre St Michel 200g"); products.add("Sablés Pur Beurre Bimo 200g");
        products.add("Sablés aux Pépites de Chocolat 200g");
        products.add("Madeleines St Michel Paquet x8"); products.add("Madeleines Mino Paquet x8");
        products.add("Madeleines Coquilles St Michel Paquet x6");
        products.add("Financiers Noisettes Paquet x6"); products.add("Cakes aux Fruits St Michel 300g");
        products.add("Cake Marbré Chocolat 300g");
        products.add("Gaufrettes Loacker Vanille Sachet 90g");
        products.add("Gaufrettes Loacker Noisette Sachet 90g");
        products.add("Gaufrettes Loacker Cacao Sachet 90g");
        products.add("Gaufrettes Ulker Chocolat Sachet 90g");
        products.add("Gaufrettes Ulker Vanille Sachet 90g");
        products.add("Gaufrettes Fourrés Chocolat Bimo Sachet 150g");
        for (String b : new String[]{"Chocolat Noir","Noisettes","Fruits Secs","Miel","Pomme-Cannelle","Cacao Cru"}) {
            products.add("Barre Céréale Saine " + b + " (x1)");
            products.add("Barre Céréale Saine " + b + " (Paquet x6)");
        }
        products.add("Barres de Muesli au Chocolat (Lot x10)");
        for (String var : new String[]{"Noir 70%","Lait","Lait Noisettes","Lait Caramel","Oreo","Daim","Mmmax Lait Noisettes","Lait Fraise","Lait Brownie","Triple Chocolat","Cœur de Caramel","Amandes","Yaourt"}) {
            products.add("Chocolat Milka " + var + " 100g");
            products.add("Chocolat Milka " + var + " 250g (Format familial)");
        }
        for (String var : new String[]{"Noir 70%","Noir 85%","Lait Noisettes","Lait Caramel","Blanc","Noir Amandes"}) {
            products.add("Chocolat Patisdecor " + var + " 100g");
            products.add("Chocolat Bellçaj " + var + " 100g");
            products.add("Chocolat Côte d'Or " + var + " 100g");
        }
        products.add("Chocolat Nestlé Noir Dessert 70% 100g");
        products.add("Barre Kinder Bueno (Pack de 2)"); products.add("Barre Kinder Bueno (Individuelle)");
        products.add("Kinder Chocolate (Barre de 4)"); products.add("Kinder Chocolate (Barre de 8)");
        products.add("Kinder Délice Paquet x4"); products.add("Kinder Schoko-bons Boîte 200g");
        products.add("Kinder Joy (x1 Oeuf)");
        for (String b : new String[]{"Mars","Snickers","Twix","Bounty","Milky Way","M&M's","Galaxy","Lion"}) {
            products.add("Barre Chocolatée " + b + " (Individuelle)");
            products.add("Barre Chocolatée " + b + " (Multi-pack x4)");
        }
        products.add("Ferrero Rocher Boîte T8 (x8)"); products.add("Ferrero Rocher Boîte T16 (x16)");
        products.add("Ferrero Rocher Boîte T24 (x24)"); products.add("Raffaello Boîte x10");
        products.add("Nutella B-ready Paquet x4"); products.add("Nutella Biscuits Paquet x8");
        products.add("Bonbons Haribo Or Pik Sachet 200g"); products.add("Bonbons Haribo Tagada Sachet 200g");
        products.add("Bonbons Haribo Croco Sachet 200g"); products.add("Bonbons Jelly Belly Sachet 100g");
        products.add("Dragées Chocolat Cémoi 200g"); products.add("Billes Crocantes Chocolat 100g");
        for (String saveur : new String[]{"Nature Sel","Fromage","Barbecue","Ketchup","Crème & Oignons","Poulet Rôti","Piment","Vinaigre & Sel"}) {
            products.add("Chips Lay's " + saveur + " Petit Format 80g");
            products.add("Chips Lay's " + saveur + " Format Standard 150g");
            products.add("Chips Lay's " + saveur + " Grand Format 270g");
            products.add("Chips Mega " + saveur + " 150g");
            products.add("Chips Maison " + saveur + " 150g");
        }
        products.add("Chips Doritos Nachos Cheese 150g"); products.add("Chips Doritos Cool Original 150g");
        products.add("Chips Doritos Sweet Chili Pepper 150g"); products.add("Chips Doritos Nachos Cheese 300g");
        products.add("Tortillas Chips Sel de Mer 200g");
        products.add("Biscuits Apéritifs Curly Sachet 180g");
        products.add("Biscuits Apéritifs Cacahuètes enrobées 200g");
        products.add("Cacahuètes Salées Sachet 200g"); products.add("Cacahuètes Salées Sachet 500g");
        products.add("Fruits Secs Mélange Apéritif 200g"); products.add("Noix de Cajou Grillées 200g");
        products.add("Amandes Grillées & Salées 200g");
        products.add("Olives Noires Apéritifs Dénoyautées Sachet 200g");
        products.add("Feuilletés apéritifs Fromage Sachet 250g");
        products.add("Chips de Pommes de Terre Fines 200g"); products.add("Palets Bretons Apéritifs 200g");
        products.add("Pop-corn Ready Microwave Salé x3"); products.add("Pop-corn Ready Microwave Caramel x3");
        products.add("Pop-corn Butterkist Prêt à manger 200g");
        for (String g : new String[]{"Vanille","Chocolat","Fraise","Café","Pistache","Noix de Coco","Cookies & Cream","Caramel Beurre Salé"}) {
            products.add("Glace Pot Familial " + g + " 1L");
            products.add("Cornet Glace " + g + " (x1)");
            products.add("Bâtonnet Glace " + g + " (x1)");
        }
        products.add("Glace Magnum Classic (x1)"); products.add("Glace Magnum Classic (Boîte x6)");
        products.add("Glace Cornetto Classique (x1)"); products.add("Glace Cornetto Classique (Boîte x6)");
        products.add("Glace Sorbets 100% Fruits 750ml");

        // 7) Petit-déjeuner & Tartinables
        products.add("Café Nescafé Classic Pot 50g"); products.add("Café Nescafé Classic Pot 100g");
        products.add("Café Nescafé Classic Pot 200g"); products.add("Café Nescafé Classic Pot 400g");
        products.add("Café Nescafé Gold Pot 100g"); products.add("Café Nescafé Gold Pot 200g");
        products.add("Café Nescafé Express Stick (x25)");
        products.add("Café Carte Noire Pot 100g"); products.add("Café Carte Noire Pot 200g");
        products.add("Café Moulu Mokador 250g"); products.add("Café Moulu Mokador 500g");
        products.add("Café Moulu Dahbi 250g"); products.add("Café Moulu Dahbi 500g");
        products.add("Café Grains 1kg"); products.add("Café Grains Arabica 500g");
        products.add("Café Nespresso Compatibles Capsules x10");
        products.add("Café Nespresso Compatibles Capsules x30");
        products.add("Café en dosettes Senseo x36");
        products.add("Thé Vert Sultan Boîte 100g"); products.add("Thé Vert Sultan Boîte 200g");
        products.add("Thé Vert Sultan Boîte 500g"); products.add("Thé Vert Sultan Boîte 1kg");
        products.add("Thé Vert Sultan Vrac 2kg");
        products.add("Thé Vert Alwazah 500g"); products.add("Thé Vert Alwazah 1kg");
        products.add("Thé Noir 555 Boîte 100g"); products.add("Thé Noir 555 Boîte 500g");
        products.add("Thé Noir Lipton Yellow Label Boîte 100g");
        products.add("Thé Infusions 4 Saveurs x20 sachets");
        for (String t : new String[]{"Menthe","Verbena","Tilleul","Thym","Romarin","Fleur d'Oranger","Camomille","Gingembre-Citron","Rooibos"}) {
            products.add("Tisane / Infusion " + t + " (x20 sachets)");
            products.add("Infusion Bio " + t + " (x20 sachets)");
        }
        products.add("Maté en Poudre 500g");
        for (String saveur : new String[]{"Fraise","Abricot","Figue","Groseille","Framboise","Pêche","Orange Amère","Marmelade","Pruneau","Fruits Rouges","Coing","Pomme"}) {
            products.add("Confiture Aïcha " + saveur + " Bocal 500g");
            products.add("Confiture Aïcha " + saveur + " Bocal 1kg");
            products.add("Confiture Extra Taillefine " + saveur + " 375g");
        }
        products.add("Pâte à Tartiner Nocilla 200g"); products.add("Pâte à Tartiner Nocilla 400g");
        products.add("Pâte à Tartiner Nocilla 750g");
        products.add("Pâte à Tartiner Choco 200g"); products.add("Pâte à Tartiner Choco 400g");
        products.add("Pâte à Tartiner Nutella Ferrero 200g"); products.add("Pâte à Tartiner Nutella Ferrero 400g");
        products.add("Pâte à Tartiner Nutella Ferrero 750g"); products.add("Pâte à Tartiner Nutella Ferrero 1kg");
        products.add("Pâte à Tartiner Bimo Choco Noisettes 400g");
        products.add("Miel de Fleurs Naturel 250g"); products.add("Miel de Fleurs Naturel 500g");
        products.add("Miel de Fleurs Naturel 1kg"); products.add("Miel de Thym Pur 250g");
        products.add("Miel de Thym Pur 500g"); products.add("Miel d'Eucalyptus 250g");
        products.add("Miel d'Oranger Amer 250g"); products.add("Miel de Jujubier (Sidr) 500g");
        products.add("Crème de Miel à Tartiner 500g");
        for (String c : new String[]{"Chocapic","Nesquik","Lion","Corn Flakes","Lucky Charms","Frosties","Cini Minis","Honey Stars","Miel Pops","Special K","Fitness","Bran Flakes","Muesli 5 Fruits","Muesli Croustillant Chocolat","Boules de Céréales Choco","Rice Krispies","All Bran"}) {
            products.add("Céréales Nestlé " + c + " Boîte 375g");
            products.add("Céréales Nestlé " + c + " Boîte 500g");
            products.add("Céréales Nestlé " + c + " Format Familial 750g");
        }
        products.add("Sucre en Morceaux Paquet 1kg"); products.add("Sucre en Morceaux Paquet 2kg");
        products.add("Sucre Semoule Sachet 1kg"); products.add("Sucre Semoule Sachet 2kg");
        products.add("Sucre Semoule Sachet 5kg"); products.add("Sucre Glace 500g");
        products.add("Sucre Roux / Cassonade 1kg"); products.add("Sucre Vergeoise 500g");
        products.add("Édulcorant Canderel Boîte x1000 comprimés"); products.add("Sucre Stick (x100)");
        products.add("Pain de Mie Crépière Nature 500g"); products.add("Pain de Mie Grande Tranches 500g");
        products.add("Pain de Mie Brioché 400g"); products.add("Pain au Chocolat Bimo Paquet x4");
        products.add("Croissants Beurre Bimo Paquet x4"); products.add("Brioche Tressée St Michel 400g");
        products.add("Brioche Butchy Paquet x10");
        products.add("Pâte de Noisettes Torréfiées 350g"); products.add("Crème de Marron 500g");
        products.add("Crêpes Prêtes à Garnir Paquet x8"); products.add("Gaufres Sucrees Paquet x8");
        products.add("Crêpes Fines Prêtes à l'Emporter x10");

        // 8) Hygiène Corporelle
        for (String parf : new String[]{"Lait d'Avoine","Aloe Vera","Fleur de Jasmin","Rose","Lavande","Miel","Lait d'Amande","Coco"}) {
            products.add("Savon Liquide Mains Palmolive " + parf + " 500ml");
            products.add("Savon Liquide Mains Palmolive " + parf + " Recharge 1L");
            products.add("Savon Liquide Mains Dettol " + parf + " 500ml");
        }
        products.add("Savon Liquide Antibactérien Dettol Original 500ml");
        products.add("Savon Moussant Flacon Pompe 500ml");
        for (String sav : new String[]{"Taous","Lux","Dove Original","Dove Pivoine","Dove Noix de Coco","Palmolive Classique","Palmolive Aloe","Fa","Lifebuoy","Mydal"}) {
            products.add("Savon Solide " + sav + " (Unité 125g)");
            products.add("Savon Solide " + sav + " (Lot de 4)");
            products.add("Savon Solide " + sav + " (Lot de 8)");
        }
        for (String parf : new String[]{"Lait d'Avoine","Original","Jasmin","Fleur d'Oranger","Coco","Grenade","Lavande","Noisette","Café","Fraîcheur Marine"}) {
            products.add("Gel Douche Palmolive " + parf + " 250ml");
            products.add("Gel Douche Palmolive " + parf + " 500ml");
            products.add("Gel Douche Palmolive " + parf + " 1L");
        }
        for (String parf : new String[]{"Aqua Pure","Fresh","Active","Aloe Vera","Coton","Océan"}) {
            products.add("Gel Douche Fa " + parf + " 250ml");
            products.add("Gel Douche Fa " + parf + " 500ml");
        }
        for (String parf : new String[]{"Original","Pivoine","Rêve Indulgent","Beurre de Karité","Aloe","Miel"}) {
            products.add("Gel Douche Dove " + parf + " 250ml");
            products.add("Gel Douche Dove " + parf + " 500ml");
        }
        for (String parf : new String[]{"Noix de Coco","Cocoa Butter","Fleurs de Coton","Lait d'Avoine","Minéral","Fraîcheur Extrême","Coco & Jacaranda"}) {
            products.add("Gel Douche Nivea " + parf + " 250ml");
            products.add("Gel Douche Nivea " + parf + " 500ml");
            products.add("Gel Douche Nivea " + parf + " Format Familial 1L");
        }
        products.add("Gel Douche Gommant Exfoliant 200ml");
        products.add("Savon Noir Beldi 250g"); products.add("Gant de Hammam Kessa x1");
        products.add("Luffa Éponge Végétale x1");
        for (String parf : new String[]{"Lait Hydratant","Cacao et Karité","Pivoine","Aloe Vera","Huile d'Argan","Beurre de Karité","Oléo-Calcaire"}) {
            products.add("Lait Hydratant Corps Palmolive " + parf + " 250ml");
            products.add("Lait Hydratant Corps Palmolive " + parf + " 400ml");
            products.add("Crème Corps Nivea " + parf + " 250ml");
            products.add("Crème Corps Nivea " + parf + " 400ml");
            products.add("Crème Corps Dove " + parf + " 250ml");
        }
        products.add("Vaseline Pure Jelly 100ml"); products.add("Vaseline Pure Jelly 250ml");
        products.add("Huile d'Argan Corps & Cheveux 250ml"); products.add("Huile d'Amande Douce 250ml");
        for (String d : new String[]{"Original Blanc","Total","Whitenings Blancheur","Gencives Sensibles","Expert Gencives","Charbon Actif","Fluor Intense","Enfants Fraise","Enfants Bubble Gum"}) {
            products.add("Dentifrice Colgate " + d + " 75ml");
            products.add("Dentifrice Colgate " + d + " 125ml");
            products.add("Dentifrice Signal " + d + " 75ml");
            products.add("Dentifrice Signal " + d + " 125ml");
        }
        products.add("Dentifrice Fluocaril Bi-Fluoré 250 75ml");
        products.add("Dentifrice Fluocaril Bi-Fluoré 250 125ml");
        products.add("Dentifrice Elmex Caries Protection 75ml");
        for (String type : new String[]{"Brosse à Dents Classique Souple","Brosse à Dents Classique Medium","Brosse à Dents Medium","Brosse à Dents Junior 6-12 ans","Brosse à Dents Enfants 3-6 ans"}) {
            products.add(type + " (Colgate x1)");
            products.add(type + " (Colgate Lot de 4)");
            products.add(type + " (Signal x1)");
        }
        products.add("Bain de Bouche Listerine Total Care 500ml");
        products.add("Bain de Bouche Listerine Fraîcheur Glacier 500ml");
        products.add("Bain de Bouche Colgate Plax 500ml"); products.add("Bain de Bouche Diarh 500ml");
        products.add("Fil Dentaire Colgate x50m");
        for (String c : new String[]{"Réparation Longs Cheveux","Nutrition Intense","Brillance et Volume","Lissage","Kératine","Huile d'Argan","Anti-Chute","Huile de Ricin"}) {
            products.add("Shampooing Elsève L'Oréal " + c + " 250ml");
            products.add("Shampooing Elsève L'Oréal " + c + " 400ml");
            products.add("Après-Shampooing Elsève L'Oréal " + c + " 250ml");
        }
        for (String c : new String[]{"Classic Clean","Argan Oil","Smooth & Silky","Anti-Pelliculaire","Strenght & Length","Detox & Hydratation","Hair Fall Resist"}) {
            products.add("Shampooing Head & Shoulders " + c + " 250ml");
            products.add("Shampooing Head & Shoulders " + c + " 400ml");
        }
        for (String c : new String[]{"Brillance & Lisse","Anti-Casse Volume","Nutrition Profonde","Réparation Ultime"}) {
            products.add("Shampooing Pantene Pro-V " + c + " 250ml");
            products.add("Shampooing Pantene Pro-V " + c + " 400ml");
        }
        for (String c : new String[]{"Bain de Shampoing Grenade","Bain de Shampoing Huile d'Olive","Shampoing Karité","Shampoing Nourricier Coco","Shampoing Ultra Doux Bébé","Shampoing Miel & Fleur d'Oranger"}) {
            products.add("Shampooing Garnier Ultra Doux " + c + " 250ml");
            products.add("Shampooing Garnier Ultra Doux " + c + " 400ml");
        }
        products.add("Shampoing Sec Batiste Original 200ml");
        products.add("Masque Réparateur Cheveux 250ml");
        products.add("Huile de Cheveux Huile Prodige Elsève 100ml");
        products.add("Crème Visage Nivea Soft Pot 100ml");
        products.add("Crème Visage Nivea Creme Original Pot 100ml");
        products.add("Crème Visage Hydratante Nivea Aqua 24h 50ml");
        products.add("Crème Visage Mixa Peaux Sensibles 50ml");
        products.add("Crème Solaire Visage Nivea SPF 30 50ml");
        products.add("Crème Solaire Corps Nivea SPF 30 200ml");
        products.add("Crème Solaire Indice 50 200ml"); products.add("Brume Solaire Sèche SPF 30 200ml");
        products.add("Après-Soleil Réparateur 200ml"); products.add("Eau Micellaire Démaquillante 400ml");
        products.add("Lait Démaquillant 400ml"); products.add("Lingettes Démaquillantes x25");
        products.add("Baume à Lèvres Nivea Cherry (x1)"); products.add("Baume à Lèvres Nivea Original (x1)");
        products.add("Baume à Lèvres Nivea Aloe Vera (x1)"); products.add("Stick Solaire Lèvres SPF 30");
        for (String d : new String[]{"Men Invisible Dry","Men Cool Kick","Pearl & Beauty","Natural Coconut","Fresh Active","Whitening","NIVEA Men Dry Impact"}) {
            products.add("Déodorant Spray Nivea " + d + " 150ml");
            products.add("Déodorant Bille Nivea " + d + " 50ml");
        }
        for (String d : new String[]{"Classic","Cobalt","Men Aqua","Women Dry","Aloe Vera"}) {
            products.add("Déodorant Spray Rexona " + d + " 150ml");
            products.add("Déodorant Bille Rexona " + d + " 50ml");
        }
        for (String d : new String[]{"Africa","Anarchy","Temptation","Marine","Clique","Sport Blast"}) {
            products.add("Déodorant Spray Axe " + d + " 150ml");
            products.add("Déodorant Bille Axe " + d + " 50ml");
        }
        for (String d : new String[]{"Aqua","Fresh","Ocean","Mousse"}) {
            products.add("Déodorant Spray Fa " + d + " 150ml");
            products.add("Déodorant Bille Fa " + d + " 50ml");
        }
        for (String s : new String[]{"Normal","Extra Long","Nuit","Ultra","Slim","Ailes Normales","Ailes Longues"}) {
            products.add("Serviettes Hygiéniques Always " + s + " Paquet x10");
            products.add("Serviettes Hygiéniques Always " + s + " Paquet x14");
            products.add("Serviettes Hygiéniques Nana " + s + " Paquet x10");
            products.add("Serviettes Hygiéniques Libresse " + s + " Paquet x10");
        }
        products.add("Protections Journalistes Nana Paquet x30");
        products.add("Protections Journalistes Always Dailies Paquet x30");
        products.add("Tampons Natracare x16");
        products.add("Coupe Menstruelle Taille S"); products.add("Coupe Menstruelle Taille M");
        for (String r : new String[]{"Gillette Blue II Jetables x5","Gillette Blue II Plus Jetables x5","Gillette Mach3 Jetables x2","Gillette Venus Breeze Jetables x2","Gillette Venus Smooth Jetables x3","Gillette Fusion5 Jetables x2","Bic Jambes Jetables x5"}) {
            products.add("Rasoir Jetable " + r);
        }
        products.add("Recharges Gillette Mach3 x4"); products.add("Recharges Gillette Fusion5 x4");
        products.add("Recharges Gillette Venus x4");
        products.add("Mousse à Raser Gillette Classic 200ml");
        products.add("Gel de Rasage Gillette Sensitive 200ml");
        products.add("Crème Epilatoire Nair Corps 200ml");
        products.add("Bandes de Cire Froide x20 (Jambes)"); products.add("Cire Orientale 400g (Pot)");
        products.add("Cotons Démaquillants x100"); products.add("Cotons Démaquillants x200");
        products.add("Cotons Ronds x80"); products.add("Gel Toilette Intime Femme 250ml");
        products.add("Lingettes Intimes x20");

        // 9) Entretien & Maison
        for (String parf : new String[]{"Original","Sensitive Peaux Sensibles","Fraîcheur Océan","Lavande","Jasmin","Color (Protéger Couleurs)","Noir (Noirs & foncés)","2 en 1 Adoucissant","Pro-Expert"}) {
            products.add("Lessive Liquide OMO " + parf + " 1.5L (30 lavages)");
            products.add("Lessive Liquide OMO " + parf + " 3L (60 lavages)");
            products.add("Lessive Liquide OMO " + parf + " 4.5L (90 lavages)");
        }
        for (String parf : new String[]{"Classic","Fresh Scent","Lily of the Valley","Ultra White"}) {
            products.add("Lessive Liquide Tide " + parf + " 1.5L");
            products.add("Lessive Liquide Tide " + parf + " 3L");
        }
        for (String parf : new String[]{"Original","Peaux Sensibles","Blancheur +++","Couleurs"}) {
            products.add("Lessive Liquide Ariel " + parf + " 1.5L");
            products.add("Lessive Liquide Ariel " + parf + " 3L");
        }
        products.add("Lessive en Poudre Ariel Classique 2kg"); products.add("Lessive en Poudre Ariel Classique 5kg");
        products.add("Lessive en Poudre OMO Classique 2kg"); products.add("Lessive en Poudre OMO Classique 5kg");
        products.add("Lessive en Poudre Max Classique 2kg"); products.add("Lessive en Poudre Max Classique 5kg");
        products.add("Lessive en Poudre Dat Classique 2kg"); products.add("Lessive en Poudre Dat Classique 5kg");
        products.add("Lessive Capsules Ariel All in 1 x25 pods"); products.add("Lessive Capsules Ariel All in 1 x50 pods");
        products.add("Lessive Capsules OMO Ultimate x25 pods"); products.add("Lessive Capsules Tide PODS x25");
        for (String parf : new String[]{"Bleu Classique","Rose","Vanille","Lavande","Fleurs Blanches","Océan","Coton"}) {
            products.add("Adoucissant Soupline " + parf + " 750ml");
            products.add("Adoucissant Soupline " + parf + " 1.5L");
            products.add("Adoucissant Soupline " + parf + " 2.5L");
        }
        products.add("Détachant en Poudre Vanish Oxi Action 500g"); products.add("Détachant en Poudre Vanish Oxi Action 1kg");
        products.add("Détachant Spray Vanish Blanc 500ml"); products.add("Détachant Spray Vanish Couleurs 500ml");
        products.add("Détachant Stick Dr Beckmann 100ml");
        for (String parf : new String[]{"Citron","Pamplemousse","Menthe","Original","Jasmin","Agrumes"}) {
            products.add("Liquide Vaisselle Express " + parf + " 1L");
            products.add("Liquide Vaisselle Express " + parf + " 2L");
            products.add("Liquide Vaisselle Express " + parf + " 5L");
            products.add("Liquide Vaisselle Dix " + parf + " 1L");
            products.add("Liquide Vaisselle Dix " + parf + " 2L");
            products.add("Liquide Vaisselle Jar " + parf + " 500ml");
            products.add("Liquide Vaisselle Jar " + parf + " 1L");
            products.add("Liquide Vaisselle Fairy " + parf + " 500ml");
            products.add("Liquide Vaisselle Fairy " + parf + " 1L");
            products.add("Liquide Vaisselle Sonnu " + parf + " 750ml");
        }
        products.add("Capsules Lave-Vaisselle Finish All in 1 x30"); products.add("Capsules Lave-Vaisselle Finish All in 1 x60");
        products.add("Poudre Lave-Vaisselle Finish 2kg"); products.add("Pastilles Lave-Vaisselle Calgonit x30");
        products.add("Sel Lave-Vaisselle 2kg"); products.add("Liquide Rinçage Lave-Vaisselle Finish 800ml");
        products.add("Anti-Calcaire Lave-Vaisselle");
        products.add("Javel Sanizor Classique 1L"); products.add("Javel Sanizor Classique 2L");
        products.add("Javel Sanizor Classique 5L"); products.add("Javel Kriz Classique 1L");
        products.add("Javel Kriz Classique 2L"); products.add("Javel Ace Classique 1L");
        products.add("Javel Ace Classique 2L"); products.add("Javel Sanytol Désinfectant Multi-Surface 1L");
        for (String parf : new String[]{"Pin","Lavande","Citron","Fleurs Fraîches","Agrumes"}) {
            products.add("Nettoyant Sols Ecover " + parf + " 1L");
            products.add("Nettoyant Sols Classique " + parf + " 1L");
            products.add("Nettoyant Sols Ultra Détergent " + parf + " 2L");
        }
        products.add("Nettoyant Multi-Usage Ajax Citron 1L"); products.add("Nettoyant Multi-Usage Ajax Fleurs Blanches 1L");
        products.add("Nettoyant Multi-Usage Ajax 2L"); products.add("Nettoyant Multi-Surface St Marc 1L");
        products.add("Dégraissant Cif Original Crème 500ml"); products.add("Dégraissant Cif Original Spray 750ml");
        products.add("Nettoyant Vitres & Écrans Cif Spray 500ml"); products.add("Nettoyant Vitres Windex 500ml");
        products.add("Nettoyant Vitres et Fenêtres 1L"); products.add("Crème à Récurer (Pierre d'argile) 500g");
        products.add("Bicarbonate Alimentaire & Nettoyage 1kg");
        products.add("Vinaigre Blanc Ménager 1L"); products.add("Vinaigre Blanc Ménager 2L");
        products.add("Savon Noir Ménager 1L"); products.add("Terre de Sommières 500g");
        products.add("Gel WC Nettoyant Domestos Classique 750ml"); products.add("Gel WC Nettoyant Domestos Bleu 750ml");
        products.add("Gel WC Cillit Bang Désinfectant 750ml"); products.add("Bloc WC Culligan x1 (pendentif)");
        products.add("Brosse WC + Support"); products.add("Nettoyant pour Lait & Calcaire Cillit Bang 750ml");
        products.add("Détartrant Machine à Laver 250ml"); products.add("Détartrant Bouilloire et Cafetière 250ml");
        for (String marque : new String[]{"Papicolor","Floral","Sofia","OK","Lotus","Kleenex"}) {
            products.add("Papier Toilette " + marque + " (Pack de 4 rouleaux)");
            products.add("Papier Toilette " + marque + " (Pack de 6 rouleaux)");
            products.add("Papier Toilette " + marque + " (Pack de 12 rouleaux)");
            products.add("Papier Toilette " + marque + " (Pack de 24 rouleaux)");
        }
        for (String marque : new String[]{"Essuie-tout Papicolor","Essuie-tout OK","Essuie-tout Lotus","Essuie-tout Maxi","Essuie-tout Sofia"}) {
            products.add(marque + " (Pack de 2)");
            products.add(marque + " (Pack de 4)");
            products.add(marque + " (Pack de 6)");
        }
        products.add("Mouchoirs Kleenex Boîte x100"); products.add("Mouchoirs Kleenex Boîte x200");
        products.add("Mouchoirs Pochette x10");
        for (String taille : new String[]{"30L","50L","100L","120L"}) {
            products.add("Sacs Poubelle " + taille + " (Rouleau x20)");
            products.add("Sacs Poubelle " + taille + " Extra Résistant (x20)");
            products.add("Sacs Poubelle " + taille + " Tri Sélectif (x30)");
        }
        products.add("Sacs à Ordures Punaisés x100 (Petits)");
        products.add("Éponges Grattantes (Pack de 2)"); products.add("Éponges Grattantes (Pack de 5)");
        products.add("Éponges Grattantes (Pack de 10)"); products.add("Éponge Spéciale Anti-Rayure x3");
        products.add("Chiffons Microfibres x5 (Sols/Vitres)"); products.add("Chiffons Microfibres x10");
        products.add("Lave-Vaisselle en Fibre x10"); products.add("Gants de Ménage Latex (Lot de 2)");
        products.add("Gants de Ménage Latex (Lot de 6)"); products.add("Balai + Balayette (Kit)");
        products.add("Balai Microfibre Plat"); products.add("Serpillière 100% Coton (Lot de 2)");
        products.add("Seau avec Essoreuse 10L"); products.add("Pelle à Poussière + Brosse");
        products.add("Pince Linge (Lot de 24)"); products.add("Étendoir à Linge Tubulaire");
        products.add("Filet de Lavage Linge Délicat x3");
        products.add("Désodorisant Maison Glade Lavande 300ml"); products.add("Désodorisant Maison Glade Vanille 300ml");
        products.add("Désodorisant Spray Air Wick Océan 300ml"); products.add("Diffuseur Parfums d'Ambiance Febreze");
        products.add("Bougie Parfumée Vanille 180g"); products.add("Bougie Parfumée Lavande 180g");
        products.add("Bougie Parfumée Fleur de Coton 180g"); products.add("Bougie Parfumée Ylang 180g");
        products.add("Encens Bâtonnets (Paquet x50)"); products.add("Bâtonnets Parfumés Diffuseur Rose 100ml");
        products.add("Raid Spray Anti-Moustiques 400ml"); products.add("Raid Diffuseur Électrique Anti-Moustiques");
        products.add("Spirales Anti-Moustiques (Boîte x30)"); products.add("Anti-Cafards Gel Injectable");
        products.add("Anti-Fourmis Granulés 500g"); products.add("Naphthalène 500g");
        products.add("Pastilles Anti-Mites x40");
        products.add("Poubelle Cuisine à Pédale 30L"); products.add("Poubelle Tri Sélectif 3 Compartiments 40L");
        products.add("Boîtes de Rangement (Lot de 5) 4L"); products.add("Boîte de Rangement Hermétique 20L");
        products.add("Boîte de Rangement Hermétique 45L"); products.add("Cling Film Rouleau 30m");
        products.add("Papier Aluminium Rouleau 10m"); products.add("Papier Cuisson / Parchemin Rouleau 10m");
        products.add("Sachets Congélation Zip (Lot x20)"); products.add("Boîtes Repas Préparés Micro-Ondables x5");
        products.add("Ampoule LED E27 10W (Pack de 3)"); products.add("Ampoule LED E27 15W (Pack de 3)");
        products.add("Ampoule LED GU10 5W (Lot de 5)"); products.add("Bougie électrique LED (Lot de 6)");
        products.add("Piles AA Duracell (Lot de 4)"); products.add("Piles AAA Duracell (Lot de 4)");
        products.add("Piles 9V x1"); products.add("Chargeur USB Double Prise Secteur");
        products.add("Kit Couture Complet (Aiguilles, fils, épingles)"); products.add("Rouleau de Colle Néoprène");
        products.add("Scotch Transparent Grand Format"); products.add("Scotch Double Face 5m");
        products.add("Ruban Adhésif Toilé 50mm"); products.add("Cutter + Lames x10");
        products.add("Ciseaux Multi-usages Paire");

        // Output
        for (String p : products) {
            System.out.println(p + " => " + slug(p));
        }
        System.err.println("Total: " + products.size());
    }
}
