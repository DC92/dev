<?php
// Load correctly syles.css files
add_action("wp_enqueue_scripts", "theme_enqueue_styles");
function theme_enqueue_styles()
{
    wp_enqueue_style(
        "parent-style",
        get_template_directory_uri() . "/style.css"
    );
   wp_register_style( 'style', get_stylesheet_uri() );
    wp_enqueue_style( 'style' );
}

// Menu haut de page
add_shortcode("menu", "menu_function");
function menu_function()
{
    global $wpdb;

    $results = $wpdb->get_results("
SELECT parent.post_title AS parent_title, parent.post_name AS parent_name, child.*
FROM wpgym_posts AS parent
JOIN wpgym_posts AS child ON parent.ID = child.post_parent
WHERE parent.post_status = 'publish' AND child.post_status = 'publish'
ORDER BY parent.menu_order, parent.post_title, child.menu_order, child.post_title
");

    $r = ["<ul class='menu'>"];

    foreach ($results as $res) {
		// Au changement de ligne
        if ($sous_menu != $res->post_parent) {
            if ($sous_menu) {
                $r[] = "\t\t</ul>\n\t</li>";
            }
            $r[] = "\t<li>\n\t\t<a href='/$res->parent_name/'>$res->parent_title</a>\n\t\t<ul>";

            $sous_menu = $res->post_parent;
        }
		
		// Pour toutes les lignes
        $r[] = "\t\t\t<li><a href='/$res->post_name/' title='Voir la page $res->post_title'>$res->post_title</a></li>";
    }

    $r[] = "\t\t</ul>\n\t</li>\n</ul>";
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

    $pages_publiees = $wpdb->get_results(
        "SELECT * FROM wpgym_posts WHERE post_status = 'publish'"
    );

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
                "<a href=\"/$p->post_name/\" title=\"Voir l'activité\">{$colonnes[1][0]}</a>",
                $date[1],
                "<a href=\"/{$post_names[$colonnes[1][2]]}/\" title=\"Voir le lieu\">{$colonnes[1][2]}</a>",
                "<a href=\"/{$post_names[$colonnes[1][3]]}/\" title=\"Voir l'animateur-ice\">{$colonnes[1][3]}</a>",
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
        $r[] = "<div class=\"horaires\">";

        ksort($horaires);
        foreach ($horaires as $no_jour => $jour) {
            $rj = ["\n\t<table>","\t<caption>{$jours_semaine[$no_jour]}</caption>\n\t"];
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
