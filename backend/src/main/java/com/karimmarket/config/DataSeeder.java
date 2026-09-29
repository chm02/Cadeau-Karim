package com.karimmarket.config;

import com.karimmarket.models.Category;
import com.karimmarket.models.Product;
import com.karimmarket.repositories.CategoryRepository;
import com.karimmarket.repositories.ProductRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.text.Normalizer;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;

/**
 * Initialisation du catalogue par defaut.
 *
 * Ce seeder est NON DESTRUCTIF : il n'appelle jamais deleteAll() en fonctionnement
 * normal. Au demarrage il ne fait que COMPLETER le catalogue :
 *   - les categories et produits manquants sont ajoutes ;
 *   - les produits deja presents (y compris ceux ajoutes ou modifies par
 *     l'admin) sont laisses intacts.
 *
 * Cause du bug "0 produit disponible" : l'ancien code appelait
 * productRepository.deleteAll() puis categoryRepository.deleteAll() a CHAQUE
 * demarrage. Toute donnee ajoutee par l'admin etait effacee, et si le seed
 * echouait apres ces deleteAll(), le site demarrait avec un catalogue vide.
 */
@Component
public class DataSeeder implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DataSeeder.class);

    @Autowired private CategoryRepository categoryRepository;
    @Autowired private ProductRepository productRepository;

    /** Active le seed au demarrage (par defaut : oui). */
    @Value("${app.seed.enabled:true}")
    private boolean seedEnabled;

    /** Vide les collections avant de reseeder. Dangereux : a n'utiliser qu'une fois. */
    @Value("${app.seed.reset:false}")
    private boolean seedReset;

    private static final String EXT_SNACKS = "|Bimo Golden|Bimo Pépito|Bimo Okey|Bimo Sablé|Bimo Tango|Henry’s Sablé|Henry’s Petit Henry’s|Henry’s Princesse|Henry’s Cigare|Excelo Momo|Excelo Bono|Excelo Dolcy|Excelo Biscotti|Oreo Original|Oreo Chocolat|Excelo King Cookies|Cookies Chocolat|Cookies Double Chocolat|Cookies Pépites de Chocolat|Cookies Vanille|Cookies Noisette|Cookies Fourrés Chocolat|Bimo Tonik|Excelo Genova|Excelo Capri|Excelo Eyo’o|Excelo Extrem|Gaufrette Chocolat|Gaufrette Vanille|Doritos Nacho Cheese|Doritos Sweet Chili|Cheetos Fromage|Cheetos Piment|Rizzi Nature|Rizzi Paprika|Rizzi Fromage|Rizzi BBQ|Rizzi Piment|Crunchips Nature|Crunchips Paprika|Crunchips Fromage|Crunchips BBQ|Crunchips Hot & Spicy|Lay’s Nature|Lay’s Fromage|Lay’s Paprika|Lay’s Barbecue|Lay’s Poulet|Lay’s Piment|Lay’s Ketchup|Lay’s Salt & Vinegar|🥔 Pringles|Pringles Original|Pringles Paprika|Pringles Sour Cream & Onion|Pringles Hot & Spicy|Pringles Cheese|Pringles BBQ|Pringles Pizza";

    private static final String EXT_HYGIENE = "|Mr Propre Liquide Nettoyant Multi-Surfaces|Mr Propre Nettoyant Sol|Mr Propre Désinfectant|ace Eau de Javel|Ace Javel Parfumée|Ace Gel Javel|Ariel Lessive|OMO Lessive|Tide Lessive|Pantene Shampoing|Head & Shoulders Shampoing|Clear Shampoing|Elseve Shampoing|Dove Shampoing|Garnier Ultra Doux Shampoing|Garnier Fructis Shampoing|Sunsilk Shampoing|Cadum Shampoing|Johnson's Shampoing|Dove Savon|Le Petit Marseillais Savon|Lux Savon|Colgate Dentifrice|Signal Dentifrice|Aquafresh Dentifrice|Brosse à dents Colgate|Brosse à dents Signal|Bain de bouche|Déodorant Dove|Déodorant Nivea|Déodorant Rexona|Déodorant Fa|Déodorant Axe|Déodorant homme|Déodorant femme|Crème hydratante|Lait corporel|Vaseline|Lingettes humides|Coton-tiges|Disques démaquillants";

    private static final String[][] CATALOGUE = {
        {"Produits Laitiers & Œufs", "🥛", "Lait UHT Demi-Écrémé Centrale Laitier 1L|Lait UHT Jaouda 1L|Yaourt Vanille Danone|Yaourt Frais Activia|Fromage en Portions La Vache qui Rit (8 portions)|Fromage Sandwich Cheddar Les Enfants|Beurre de Table Centrale (Plaquette 250g)|Crème Fraîche Président 200ml|Lait Fermenté (Lben) Jaouda 1L|Petit Suisse Danone (Pack de 6)|Yaourt à Boire Raibi Jamila|Flan Vanille Sindibad|Œufs Frais (Plateau de 30 pièces)|Fromage Râpé Mozzarella Président 200g|Lait Chocolaté Joy 20cl|Yaourt Fruité Purity|Beurre Doux Président 200g|Fromage Blanc Salé Jben|Crème Dessert Danette Chocolat|Lait Entier Centrale 1L"},
        {"Biscuits, Gâteaux & Snacks", "🍪", "Biscuit Fourré Merendina Bimo|Gâteau Cake Timeout Bimo|Biscuit Pinguin Bimo|Gâteau Madeleine Trocadéro|Biscuits Sablés Cookies Maryland|Gaufrette Tonik Bimo|Chips Salées Lay's Grand Format|Chips Go,s Go Go (Go's)|Chips Pringles Original 165g|Chips Crunships Go's|Biscuits Roci Bimo|Gâteau Swiss Roll Bimo|Biscuits Digestive Bolino / Nakat|Barre Chocolatée KitKat Nestlé|Chocolat Noir Milka 100g|Biscuits Golden Ring Bimo|Gaufrette Excel Bimo|Popcorn Salé prêt à consommer|Biscuits Salés Tucs|Biscuits Prince Lu"},
        {"Épicerie & Féculents", "🛒", "Pâtes Spaghettis Rima 500g|Pâtes Penne Rima 500g|Couscous Fin Dari 1kg|Couscous Moyen Dari 1kg|Huile de Table Lesieur 2L|Huile de Tournesol Cristal 1L|Riz Rond Rizi 1kg|Riz Basmati Rizi 1kg|Concentré de Tomates Aïcha 800g|Tomate Pelée en Boîte Aïcha|Sel Blanc Fin 1kg|Sucre en Morceaux La Ligne Rouge 1kg|Farine de Blé Tendre Labelle 1kg|Lentilles Nettoyées Rizi 500g|Pois Chicots Rizi 500g|Haricots Blancs Rizi 500g|Mayonnaise Classique Aïcha 225g|Ketchup Doux Aïcha 300g|Thon à l'Huile Vénus / Tom|Vinaigrette / Vinaigre Blanc Cristal"},
        {"Entretien & Hygiène de la Maison", "🧼", "Lessive Liquide Machine OMO 3L|Lessive en Poudre Tide 2kg|Liquide Vaisselle Express 1L (Citron)|Nettoyant Sols Ajax 1L|Nettoyant Multi-usages Dettol|Gel Douche Palmolive 250ml|Savon Liquide pour les Mains Dettol|Savon Solide Cadum / Taous|Shampoing Head & Shoulders 400ml|Dentifrice Colgate Total 75ml|Brosse à Dents Colgate (Pack)|Déodorant Spray Nivea Men / Women|Déodorant Spray AXE|Papier Hygiénique Papicolor (Pack de 6)|Essuie-tout Sopalin|Éponges Grattantes (Paquet de 4)|Sacs Poubelle Résistants 30L / 50L|Désodorisant d'Intérieur Febreze / Glade|Lingettes Désinfectantes Nettoyantes|Coton-tiges hygiéniques"},
        {"Boissons & Eaux", "🥤", "Eau Minérale Naturelle Sidi Ali 1.5L|Eau Minérale Aïn Soltane 1.5L|Eau Minérale Sidi Harzem 1.5L|Boisson Gazeuse Coca-Cola 1.5L|Boisson Gazeuse Coca-Cola Zéro 1.5L|Boisson Gazeuse Hawaï 1L|Boisson Gazeuse Pampsin 1L|Boisson Gazeuse Check / Orangina 1L|Boisson Gazeuse Sprite 1.5L|Boisson Gazeuse Schweppes Tonic 1L|Jus de Fruits Multifruit Marrakech 1L|Nectar d'Orange Pampa 1L|Boisson Energisante Red Bull 250ml|Boisson Energisante Freez|Thé Glacé Lipton Pêche 1.5L|Lait Aromatisé Fraise Centrale 20cl|Sirop de Grenadine Leader Price / Top|Eau Gazeuse Oulmès 1L|Boisson Lactée Yaourt à boire|Jus de Pomme Pressé local|Eau Minérale Naturelle Sidi Ali 33cl|Eau Minérale Naturelle Sidi Ali 50cl|Eau Minérale Naturelle Sidi Ali 2L|Eau Minérale Naturelle Sidi Harazem 1.5L|Eau Minérale Naturelle Sidi Harazem 5L|Eau Minérale Naturelle Aïn Saïss 33cl|Eau Minérale Naturelle Aïn Saïss 50cl|Eau Minérale Naturelle Aïn Saïss 1.5L|Eau Minérale Naturelle Aïn Saïss 5L|Eau Minérale Naturelle Aïn Ifrane 33cl|Eau Minérale Naturelle Aïn Ifrane 50cl|Eau Minérale Naturelle Aïn Ifrane 1.5L|Eau Minérale Naturelle Aïn Soltane 33cl|Eau Minérale Naturelle Aïn Soltane 50cl|Eau Minérale Naturelle Aïn Soltane 1.5L|Eau Minérale Naturelle Aïn Atlas 5L|Eau Minérale Gazeuse Oulmès 50cl|Eau Minérale Gazeuse Oulmès 1L|Fanta Orange 25cl|Fanta Orange 1L|Fanta Orange 1.5L|Fanta Lemon 25cl|Fanta Lemon 1L|Fanta Pomme 25cl|Fanta Pomme 1L|Fanta Grenade 25cl|Fanta Grenade 1L|Hawaï Ananas 25cl|Hawaï Ananas 33cl|Hawaï Ananas 50cl|Hawaï Ananas 1L|Hawaï Ananas 1.5L|Hawaï Tropical 25cl|Hawaï Tropical 33cl|Hawaï Tropical 50cl|Hawaï Tropical 1L|Hawaï Tropical 1.5L|Hawaï Fruit de la Passion 50cl|Hawaï Fruit de la Passion 1L|Ice Ananas 33cl|Ice Cola Strong 33cl|Ice Cola Strong 1.5L|Ice Limonade 33cl|Ice Orange 33cl|Ice Passion 33cl|Ice Passion 1.5L|Ice Pomme 33cl|Ice Pulpa Citron 33cl|Ice Pulpa Orange 33cl|Lipton Ice Tea Pêche 33cl|Lipton Ice Tea Fruits Rouges 33cl|Jus Bi Frutas Granada 33cl|Jus Bi Frutas Mediterraneo 1L|Jus Bi Frutas Tropical 33cl|Jus Cocktail Multifruits Marrakech 1L|Jus Frut Orange Max Marrakech 2L|Jus de Mango Juver 1L|Jus de Pêche Juver 25cl|Jus Disfruta Naranja Juver 20cl|Juver Selección Pineapple 20cl|Kidy Ananas|Kidy Cocktail|Kidy Mangue|Kidy Orange|Kidy Pomme|Jibi Choco Boom 20cl|Mon Jus Orange 25cl|7UP 1L|Limonade Cigogne 25cl|Limonade Cigogne 33cl|Mirinda Orange 25cl|Mirinda Plus Ananas 1L|Mirinda Pomme 25cl|Mirinda Pomme 50cl|Mirinda Pomme 1L|Mirinda Pomme 1.5L|Mirinda Tropical 25cl|Mirinda Tropical 33cl|Mirinda Tropical 50cl|Monster Energy 50cl|Rockstar Original 50cl|Rockstar Guayaba 50cl|Rockstar Kiwi 50cl|Rockstar Cañamo 50cl|Sting Berry 25cl|Sting Gold 25cl|Linx Watermelon 25cl|Enjoy Citron 50cl|Enjoy Fraise 50cl|Enjoy Orange 50cl|Enjoy Orange 1.5L|Enjoy Tropical 50cl|Enjoy Tropical 1.5L|Evervess Tonic 1L|Orangina 25cl|Orangina 50cl|Orangina 1L|Orangina Zero 1L|Coca-Cola 25cl|Coca-Cola 33cl|Coca-Cola 50cl|Coca-Cola 1L|Coca-Cola 1.5L|Coca-Cola Zero 33cl|Coca-Cola Zero 50cl|Pepsi 33cl|Pepsi 50cl|Pepsi 1.5L|Sprite 33cl|Sprite 50cl|Sprite 1.5L|Schweppes Tonic 25cl|Schweppes Tonic 1L|Red Bull Energy Drink 25cl|Red Bull Energy Drink 33cl|Abtal Fraise 20cl|Abtal Mangue 20cl|Abtal Orange 20cl|Abtal Cocktail 20cl|Abtal Ananas 20cl|Jaco Pulpa Orange 33cl|Fanta Lemon 33cl|Sting Blue 25cl|Schweppes Citron 25cl|Juver Disfruta Multifruits 20cl|Jus Disfruta Peche Juver 1L|Eau Minerale Naturelle Ain Atlas 1.5L|Boisson Mandarina Simon Life 1.5L|Juver Disfruta Multifruits 1L|Juver Disfruta Tropical 20cl|Jus Cocktail Jaouda 25cl|Raibi Chergui Orange|Raibi Chergui Fraise"},
        {"Accessoires Multimédia & Électronique", "🔌", "Câble Chargeur Rapide USB Type-C|Câble Chargeur iPhone Lightning|Chargeur Secteur Mural Rapide (USB + Type-C)|Écouteurs Filaires Jack 3.5mm / Type-C|Écouteurs Sans Fil Bluetooth (AirPods style)|Support Téléphone Voiture Magnétique|Batterie Externe (Power Bank) 10000mAh|Clé USB 32GB SanDisk|Mini Enceinte Bluetooth Portable|Verre Trempé Protection d'écran Universel"}
    };

    /** Ajouts de catalogue historiquement concaténés au tableau principal. */
    private static void applyExtensions() {
        CATALOGUE[1][2] += EXT_SNACKS;
        CATALOGUE[3][2] += EXT_HYGIENE;
    }

    @Override
    public void run(String... args) {
        if (!seedEnabled) {
            log.info("Seed desactive (app.seed.enabled=false) : catalogue inchange.");
            return;
        }
        try {
            seed();
        } catch (RuntimeException e) {
            // Le seed ne doit JAMAIS empecher l'application de demarrer :
            // une base vide ou un Mongo indisponible ne doit pas casser le site.
            log.error("Echec du seed du catalogue (base inchangee) : {}", e.getMessage());
        }
    }

    private void seed() {
        applyExtensions();
        if (seedReset) {
            log.warn("app.seed.reset=true : les produits et categories vont etre effaces puis regeneres.");
            productRepository.deleteAll();
            categoryRepository.deleteAll();
        }

        // 1. Categories : on cree uniquement celles qui manquent, et on
        //    restaure l'icone si elle a disparu.
        List<Category> categories = seedCategories();
        if (categories.isEmpty()) {
            log.warn("Aucune categorie disponible, seed des produits ignore.");
            return;
        }

        // 2. Produits : on n'ajoute que les absents. Les produits existants
        //    (seed + ajouts admin) ne sont jamais ecrases ni supprimes.
        int created = 0;
        for (int i = 0; i < categories.size(); i++) {
            Category category = categories.get(i);
            Set<String> existing = new HashSet<>();
            for (Product p : productRepository.findByCategoryId(category.getId())) {
                if (p.getName() != null) existing.add(key(p.getName()));
            }
            for (String name : CATALOGUE[i][2].split("\\|")) {
                if (name.isBlank()) continue;
                if (!existing.add(key(name))) continue;
                productRepository.save(Product.builder()
                    .name(name).price(1.0).imageUrl(slug(name))
                    .categoryId(category.getId()).build());
                created++;
            }
        }

        log.info("Catalogue verifie : {} produit(s) crees, {} au total.", created, productRepository.count());
    }

    private List<Category> seedCategories() {
        Map<String, Category> byName = categoryRepository.findAll().stream()
            .filter(c -> c.getName() != null)
            .collect(Collectors.toMap(c -> key(c.getName()), Function.identity(), (a, b) -> a));

        List<Category> ordered = new ArrayList<>();
        for (String[] row : CATALOGUE) {
            Category existing = byName.get(key(row[0]));
            if (existing == null) {
                existing = categoryRepository.save(
                    Category.builder().name(row[0]).icon(row[1]).build());
                log.info("Categorie creee : {}", row[0]);
            } else if (existing.getIcon() == null || existing.getIcon().isBlank()) {
                existing.setIcon(row[1]);
                existing = categoryRepository.save(existing);
            }
            ordered.add(existing);
        }
        return ordered;
    }

    /** Cle de comparaison insensible a la casse, aux accents et a la ponctuation. */
    private String key(String name) {
        return Normalizer.normalize(name, Normalizer.Form.NFD)
            .replaceAll("\\p{InCombiningDiacriticalMarks}+", "")
            .toLowerCase(Locale.ROOT)
            .replaceAll("[^a-z0-9]+", " ")
            .trim();
    }

    private String slug(String name) {
        return key(name).replaceAll("\\s+", "-") + ".jpg";
    }
}
