<?php
// Load correctly syles.css files
add_action("wp_enqueue_scripts", "theme_enqueue_styles");
function theme_enqueue_styles()
{
    wp_register_style("style", get_stylesheet_uri());
    wp_enqueue_style("style");
}

// Use global urls in block templates (as defined in wp-includes/general-template.php)
add_shortcode("get_info", "get_info_function");
function get_info_function($args)
{
    return get_bloginfo($args[0]);
}

// Add favicon
add_action("wp_head", "_block_template_favicon", 1);
function _block_template_favicon()
{
    echo '<link rel="icon" type="image/jpg" href="' .
        get_stylesheet_directory_uri() .
        '/images/icon.jpg" />' .
        PHP_EOL;
}

// Menu haut de page
add_shortcode("menu", "menu_function");
function menu_function()
{
    global $wpdb;

    preg_match('|/[^/]+/$|', $_SERVER["REQUEST_URI"], $page_url);

    $pages = $wpdb->get_results("
SELECT child.post_title, child.post_name,
  parent.post_title AS parent_title,
  parent.post_name AS parent_name, parent.ID AS parent_id
FROM wpgym_posts AS parent
JOIN wpgym_posts AS child ON parent.ID = child.post_parent
WHERE parent.post_status = 'publish' AND child.post_status = 'publish'
ORDER BY parent.menu_order, parent.post_title, child.menu_order, child.post_title
");

    $r = ['<ul class="menu">'];

    foreach ($pages as $p) {
        // Au changement de ligne
        if ($sous_menu != $p->parent_id) {
            if ($sous_menu) {
                $r[] = "\t\t</ul>\n\t</li>";
            }
            $r[] = "\t<li>\n\t\t<a onclick=\"return clickMenu(event,this)\" href='/$p->parent_name/'>$p->parent_title</a>\n\t\t<ul>";

            $sous_menu = $p->parent_id;
        }

        // Pour toutes les lignes
        $r[] = "\t\t\t<li><a href='/$p->post_name/' title='Voir la page'>$p->post_title</a></li>";

        // Accueil
        if (!count($page_url)) {
            $id_edit = get_site_option("page_on_front");
        }
        // Catégorie
        if ("/$p->parent_name/" == $page_url[0]) {
            $id_edit = $p->parent_id;
        }
        // Entrée
        if ("/$p->post_name/" == $page_url[0]) {
            $id_edit = $p->ID;
        }
    }

    $r[] = "\t\t</ul>\n\t</li>\n</ul>";
    if ($id_edit) {
        $r[] =
            '<a class="crayon" title="Modification de la page" href="' .
            get_bloginfo("url") .
            "/wp-admin/post.php?&action=edit&post=" .
            $id_edit .
            '">&#9998;</a>';
    }

    return implode(PHP_EOL, $r);
}

// Horaires
add_shortcode("horaires", "horaires_function");
function horaires_function()
{
    global $wpdb;
    $jours_semaine = [
        "lundi",
        "mardi",
        "mercredi",
        "jeudi",
        "vendredi",
        "samedi",
        "dimanche",
    ];

    preg_match('|/[^/]+/$|', $_SERVER["REQUEST_URI"], $page_url);

    $pages_publiees = $wpdb->get_results("
SELECT post_title, post_name, post_content
FROM wpgym_posts
WHERE post_status = 'publish'
");

    foreach ($pages_publiees as $p) {
        $post_names[$p->post_title] = $p->post_name;
        $post_titles[$p->post_name] = $p->post_title;
    }

    foreach ($pages_publiees as $p) {
        preg_match_all("|<tr>.*</tr>|U", $p->post_content, $lignes);
        foreach ($lignes[0] as $l) {
            preg_match_all("|<td>(.*)</td>|U", $l, $colonnes);
            $date = explode(" ", $colonnes[1][1], 2);
            $no_jour = array_search(strtolower(trim($date[0])), $jours_semaine);

            $ligne_horaire = [
                '<a title="Voir l\'activité" href="' .
                get_bloginfo("url") .
                "/{$p->post_name}/\">{$colonnes[1][0]}</a>",

                $date[1],

                '<a title="Voir le lieu" href="' .
                get_bloginfo("url") .
                "/{$post_names[$colonnes[1][2]]}/\">{$colonnes[1][2]}</a>",

                '<a title="Voir l\'animateur-ice" href="' .
                get_bloginfo("url") .
                "/{$post_names[$colonnes[1][3]]}/\">{$colonnes[1][3]}</a>",
            ];

            if (
                str_contains(
                    implode("/horaires/", $ligne_horaire),
                    $page_url[0]
                )
            ) {
                $horaires[$no_jour][$date[1]][] = $ligne_horaire;
            }
        }
    }

    if (count($horaires)) {
        $r[] = "\n<div class=\"horaires\">";

        ksort($horaires);
        foreach ($horaires as $no_jour => $jour) {
            $rj = [
                "\t<table>",
                "\t\t<caption>{$jours_semaine[$no_jour]}</caption>",
            ];
            ksort($jour);
            foreach ($jour as $heure) {
                foreach ($heure as $ligne) {
                    $rj[] =
                        "\t\t<tr>\n\t\t\t<td>" .
                        implode("</td>\n\t\t\t<td>", $ligne) .
                        "</td>\n\t\t</tr>";
                }
            }
            $rj[] = "\t</table>";
            $r[] = implode(PHP_EOL, $rj);
        }
        $r[] = "</div>";
        return implode(PHP_EOL, $r);
    }
}

?>
