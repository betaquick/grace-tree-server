insert into user_product (userId, productId) select userId, 1 as 'productId' from user where userId not in (select userId from user_product where productId > 0);