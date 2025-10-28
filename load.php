
add_action('wp_head', function() {
    $products = get_posts([
        'post_type'      => 'product',
        'post_status'    => 'publish',
        'posts_per_page' => -1,
        'fields'         => 'ids',
    ]);

    $product_variations = [];

    foreach ($products as $product_id) {
        if ($product_id == 3601 || $product_id == 3770) {
        $product = wc_get_product($product_id);

        if ($product && $product->is_type('variable')) {
            $variations = $product->get_available_variations();
            $variation_data = [];

            foreach ($variations as $variation) {
                $color = $variation['attributes']['attribute_pa_farbe'] ?? null;
                $length_str = $variation['attributes']['attribute_pa_laengen'] ?? null;

                if ($color && $length_str) {
                    // Convert length to number (remove non-digit characters)
                    $length = floatval(preg_replace('/[^\d.]/', '', $length_str));

                    // only include variations with '9007' in color
                    if (strpos($color, '9007') === false) {
                        continue;
                    }

                    $variation_data[] = [
                        'id' => $variation['variation_id'],
                        'color' => $color,
                        'length' => $length,
                        'width' => $product_id === 3601 ? 140 : 200,
                    ];
                }
            }

            if (!empty($variation_data)) {
                $product_variations[$product_id === 3601 ? 'S' : 'L'] = $variation_data;
            }
        }
    }
    }

    echo '<script>window.WC_PRODUCT_VARIATIONS = ' . wp_json_encode($product_variations) . ';</script>';
});


