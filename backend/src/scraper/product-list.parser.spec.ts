import { parseProductListHtml } from "./product-list.parser";

const MOCK_HTML = `
<!DOCTYPE html>
<html>
<body>
	<div class="ais-InfiniteHits">
		<ul>
			<!-- Happy Path: Standard product with all fields -->
			<li class="ais-InfiniteHits-item">
				<div class="main-product-card">
					<div class="card" data-product-id="12345">
						<div class="card__inner">
							<img src="https://cdn.example.com/book1.jpg" alt="Book 1" />
						</div>
						<div class="card__heading">
							<a href="/en-gb/product/the-great-gatsby-12345" 
							   class="product-card"
							   data-item_id="12345"
							   data-item_name="The Great Gatsby"
							   data-price="8.99">
								The Great Gatsby
							</a>
						</div>
						<p class="author">F. Scott Fitzgerald</p>
						<span class="price-item">£8.99</span>
					</div>
				</div>
			</li>

			<!-- Price Missing - should use fallback price-item text -->
			<li class="ais-InfiniteHits-item">
				<div class="main-product-card">
					<div class="card" data-product-id="67890">
						<div class="card__inner">
							<img src="/images/book2.jpg" alt="Book 2" />
						</div>
						<div class="card__heading">
							<a href="/en-gb/product/1984-67890" 
							   class="product-card"
							   data-item_id="67890"
							   data-item_name="1984">
								1984
							</a>
						</div>
						<p class="author">George Orwell</p>
						<span class="price-item">$12.50</span>
					</div>
				</div>
			</li>

			<!-- USD Currency with decimal -->
			<li class="ais-InfiniteHits-item">
				<div class="main-product-card">
					<div class="card" data-product-id="11111">
						<div class="card__inner">
							<img src="//cdn.example.com/book3.jpg" alt="Book 3" />
						</div>
						<div class="card__heading">
							<a href="https://www.worldofbooks.com/en-gb/product/to-kill-a-mockingbird-11111" 
							   class="full-unstyled-link"
							   data-item_id="11111"
							   data-item_name="To Kill a Mockingbird"
							   data-price="15.75">
								To Kill a Mockingbird
							</a>
						</div>
						<p class="author">Harper Lee</p>
						<span class="price-item">$15.75</span>
					</div>
				</div>
			</li>

			<!-- EUR Currency -->
			<li class="ais-InfiniteHits-item">
				<div class="main-product-card">
					<div class="card" data-product-id="22222">
						<div class="card__inner">
							<img src="/images/book4.jpg" alt="Book 4" />
						</div>
						<div class="card__heading">
							<a href="/en-gb/product/pride-and-prejudice-22222" 
							   class="product-card"
							   data-item_id="22222"
							   data-item_name="Pride and Prejudice"
							   data-price="10.50">
								Pride and Prejudice
							</a>
						</div>
						<p class="author">Jane Austen</p>
						<span class="price-item">€10.50</span>
					</div>
				</div>
			</li>

			<!-- Missing Image URL -->
			<li class="ais-InfiniteHits-item">
				<div class="main-product-card">
					<div class="card" data-product-id="33333">
						<div class="card__inner">
						</div>
						<div class="card__heading">
							<a href="/en-gb/product/jane-eyre-33333" 
							   class="product-card"
							   data-item_id="33333"
							   data-item_name="Jane Eyre"
							   data-price="9.99">
								Jane Eyre
							</a>
						</div>
						<p class="author">Charlotte Brontë</p>
						<span class="price-item">£9.99</span>
					</div>
				</div>
			</li>

			<!-- Missing Author - should be null -->
			<li class="ais-InfiniteHits-item">
				<div class="main-product-card">
					<div class="card" data-product-id="44444">
						<div class="card__inner">
							<img src="/images/book5.jpg" alt="Book 5" />
						</div>
						<div class="card__heading">
							<a href="/en-gb/product/animal-farm-44444" 
							   class="product-card"
							   data-item_id="44444"
							   data-item_name="Animal Farm"
							   data-price="7.50">
								Animal Farm
							</a>
						</div>
						<span class="price-item">£7.50</span>
					</div>
				</div>
			</li>

			<!-- Missing Title - should return null (validation fails) -->
			<li class="ais-InfiniteHits-item">
				<div class="main-product-card">
					<div class="card" data-product-id="55555">
						<div class="card__inner">
							<img src="/images/book6.jpg" alt="Book 6" />
						</div>
						<div class="card__heading">
							<a href="/en-gb/product/unknown-book-55555" 
							   class="product-card"
							   data-item_id="55555"
							   data-price="5.99">
							</a>
						</div>
						<p class="author">Unknown Author</p>
						<span class="price-item">£5.99</span>
					</div>
				</div>
			</li>

			<!-- Malformed HTML - missing card[data-product-id] -->
			<li class="ais-InfiniteHits-item">
				<div class="main-product-card">
					<div class="card">
						<div class="card__inner">
							<img src="/images/book7.jpg" alt="Book 7" />
						</div>
						<div class="card__heading">
							<a href="/en-gb/product/broken-book-77777" 
							   class="product-card">
								Broken Book
							</a>
						</div>
						<p class="author">Broken Author</p>
						<span class="price-item">£3.99</span>
					</div>
				</div>
			</li>

			<!-- Missing Price entirely -->
			<li class="ais-InfiniteHits-item">
				<div class="main-product-card">
					<div class="card" data-product-id="66666">
						<div class="card__inner">
							<img src="/images/book8.jpg" alt="Book 8" />
						</div>
						<div class="card__heading">
							<a href="/en-gb/product/free-book-66666" 
							   class="product-card"
							   data-item_id="66666"
							   data-item_name="Free Book">
								Free Book
							</a>
						</div>
						<p class="author">Free Author</p>
					</div>
				</div>
			</li>

			<!-- Integer price without decimal -->
			<li class="ais-InfiniteHits-item">
				<div class="main-product-card">
					<div class="card" data-product-id="99999">
						<div class="card__inner">
							<img src="/images/book9.jpg" alt="Book 9" />
						</div>
						<div class="card__heading">
							<a href="/en-gb/product/cheap-book-99999" 
							   class="product-card"
							   data-item_id="99999"
							   data-item_name="Cheap Book"
							   data-price="5">
								Cheap Book
							</a>
						</div>
						<p class="author">Cheap Author</p>
						<span class="price-item">£5</span>
					</div>
				</div>
			</li>
		</ul>
	</div>
</body>
</html>
`;

describe("parseProductListHtml", () => {
	describe("price parsing logic with describe.each", () => {
		const priceTestCases = [
			{
				description: "GBP price with data-price attribute",
				html: `
					<li class="ais-InfiniteHits-item">
						<div class="main-product-card">
							<div class="card" data-product-id="1">
								<div class="card__heading">
									<a href="/en-gb/product/test-1" 
									   class="product-card"
									   data-item_id="1"
									   data-item_name="Test Book"
									   data-price="8.99">Test Book</a>
								</div>
								<span class="price-item">£8.99</span>
							</div>
						</div>
					</li>
				`,
				expectedPrice: 8.99,
				expectedCurrency: "GBP",
			},
			{
				description: "USD price from text when data-price missing",
				html: `
					<li class="ais-InfiniteHits-item">
						<div class="main-product-card">
							<div class="card" data-product-id="2">
								<div class="card__heading">
									<a href="/en-gb/product/test-2" 
									   class="product-card"
									   data-item_id="2"
									   data-item_name="Test Book">Test Book</a>
								</div>
								<span class="price-item">$12.50</span>
							</div>
						</div>
					</li>
				`,
				expectedPrice: 12.5,
				expectedCurrency: "USD",
			},
			{
				description: "EUR price from text",
				html: `
					<li class="ais-InfiniteHits-item">
						<div class="main-product-card">
							<div class="card" data-product-id="3">
								<div class="card__heading">
									<a href="/en-gb/product/test-3" 
									   class="product-card"
									   data-item_id="3"
									   data-item_name="Test Book">Test Book</a>
								</div>
								<span class="price-item">€15.00</span>
							</div>
						</div>
					</li>
				`,
				expectedPrice: 15,
				expectedCurrency: "EUR",
			},
			{
				description: "GBP price from text without data-price",
				html: `
					<li class="ais-InfiniteHits-item">
						<div class="main-product-card">
							<div class="card" data-product-id="4">
								<div class="card__heading">
									<a href="/en-gb/product/test-4" 
									   class="product-card"
									   data-item_id="4"
									   data-item_name="Test Book">Test Book</a>
								</div>
								<span class="price-item">£9.50</span>
							</div>
						</div>
					</li>
				`,
				expectedPrice: 9.5,
				expectedCurrency: "GBP",
			},
			{
				description: "Integer price without decimal",
				html: `
					<li class="ais-InfiniteHits-item">
						<div class="main-product-card">
							<div class="card" data-product-id="5">
								<div class="card__heading">
									<a href="/en-gb/product/test-5" 
									   class="product-card"
									   data-item_id="5"
									   data-item_name="Test Book"
									   data-price="10">Test Book</a>
								</div>
								<span class="price-item">£10</span>
							</div>
						</div>
					</li>
				`,
				expectedPrice: 10,
				expectedCurrency: "GBP",
			},
			{
				description: "Missing price defaults to 0 GBP",
				html: `
					<li class="ais-InfiniteHits-item">
						<div class="main-product-card">
							<div class="card" data-product-id="6">
								<div class="card__heading">
									<a href="/en-gb/product/test-6" 
									   class="product-card"
									   data-item_id="6"
									   data-item_name="Test Book">Test Book</a>
								</div>
							</div>
						</div>
					</li>
				`,
				expectedPrice: 0,
				expectedCurrency: "GBP",
			},
		];

		test.each(priceTestCases)("should parse $description", ({
			html,
			expectedPrice,
			expectedCurrency,
		}) => {
			const result = parseProductListHtml(html);
			expect(result).toHaveLength(1);
			expect(result[0].price).toBe(expectedPrice);
			expect(result[0].currency).toBe(expectedCurrency);
		});
	});

	describe("URL handling variations", () => {
		test("should convert relative URLs to absolute URLs", () => {
			const html = `
				<li class="ais-InfiniteHits-item">
					<div class="main-product-card">
						<div class="card" data-product-id="1">
							<div class="card__heading">
								<a href="/en-gb/product/test-book-1" 
								   class="product-card"
								   data-item_id="1"
								   data-item_name="Test Book"
								   data-price="8.99">Test Book</a>
							</div>
						</div>
					</div>
				</li>
			`;
			const result = parseProductListHtml(html);
			expect(result[0].url).toBe(
				"https://www.worldofbooks.com/en-gb/product/test-book-1",
			);
		});

		test("should handle absolute URLs unchanged", () => {
			const html = `
				<li class="ais-InfiniteHits-item">
					<div class="main-product-card">
						<div class="card" data-product-id="1">
							<div class="card__heading">
								<a href="https://www.worldofbooks.com/en-gb/product/test-book-1" 
								   class="product-card"
								   data-item_id="1"
								   data-item_name="Test Book"
								   data-price="8.99">Test Book</a>
							</div>
						</div>
					</div>
				</li>
			`;
			const result = parseProductListHtml(html);
			expect(result[0].url).toBe(
				"https://www.worldofbooks.com/en-gb/product/test-book-1",
			);
		});

		test("should convert protocol-relative URLs to absolute URLs", () => {
			const html = `
				<li class="ais-InfiniteHits-item">
					<div class="main-product-card">
						<div class="card" data-product-id="1">
							<div class="card__heading">
								<a href="//www.worldofbooks.com/en-gb/product/test-book-1" 
								   class="product-card"
								   data-item_id="1"
								   data-item_name="Test Book"
								   data-price="8.99">Test Book</a>
							</div>
						</div>
					</div>
				</li>
			`;
			const result = parseProductListHtml(html);
			expect(result[0].url).toBe(
				"https://www.worldofbooks.com/en-gb/product/test-book-1",
			);
		});

		test("should extract slug from URL", () => {
			const html = `
				<li class="ais-InfiniteHits-item">
					<div class="main-product-card">
						<div class="card" data-product-id="1">
							<div class="card__heading">
								<a href="/en-gb/product/the-great-gatsby-12345?param=value#section" 
								   class="product-card"
								   data-item_id="1"
								   data-item_name="Test Book"
								   data-price="8.99">Test Book</a>
							</div>
						</div>
					</div>
				</li>
			`;
			const result = parseProductListHtml(html);
			expect(result[0].slug).toBe("the-great-gatsby-12345");
		});
	});

	describe("missing fields handling", () => {
		test("should handle missing image URL (set to null)", () => {
			const html = `
				<li class="ais-InfiniteHits-item">
					<div class="main-product-card">
						<div class="card" data-product-id="1">
							<div class="card__inner"></div>
							<div class="card__heading">
								<a href="/en-gb/product/test-book-1" 
								   class="product-card"
								   data-item_id="1"
								   data-item_name="Test Book"
								   data-price="8.99">Test Book</a>
							</div>
						</div>
					</div>
				</li>
			`;
			const result = parseProductListHtml(html);
			expect(result[0].imageUrl).toBeNull();
		});

		test("should handle missing author (set to null)", () => {
			const html = `
				<li class="ais-InfiniteHits-item">
					<div class="main-product-card">
						<div class="card" data-product-id="1">
							<div class="card__inner">
								<img src="/images/book.jpg" alt="Book" />
							</div>
							<div class="card__heading">
								<a href="/en-gb/product/test-book-1" 
								   class="product-card"
								   data-item_id="1"
								   data-item_name="Test Book"
								   data-price="8.99">Test Book</a>
							</div>
						</div>
					</div>
				</li>
			`;
			const result = parseProductListHtml(html);
			expect(result[0].author).toBeNull();
		});

		test("should return null for product missing title (validation fails)", () => {
			const html = `
				<li class="ais-InfiniteHits-item">
					<div class="main-product-card">
						<div class="card" data-product-id="1">
							<div class="card__inner">
								<img src="/images/book.jpg" alt="Book" />
							</div>
							<div class="card__heading">
								<a href="/en-gb/product/test-book-1" 
								   class="product-card"
								   data-item_id="1"
								   data-price="8.99"></a>
							</div>
						</div>
					</div>
				</li>
			`;
			const result = parseProductListHtml(html);
			expect(result).toHaveLength(0);
		});

		test("should convert relative image URLs to absolute", () => {
			const html = `
				<li class="ais-InfiniteHits-item">
					<div class="main-product-card">
						<div class="card" data-product-id="1">
							<div class="card__inner">
								<img src="/images/book.jpg" alt="Book" />
							</div>
							<div class="card__heading">
								<a href="/en-gb/product/test-book-1" 
								   class="product-card"
								   data-item_id="1"
								   data-item_name="Test Book"
								   data-price="8.99">Test Book</a>
							</div>
						</div>
					</div>
				</li>
			`;
			const result = parseProductListHtml(html);
			expect(result[0].imageUrl).toBe(
				"https://www.worldofbooks.com/images/book.jpg",
			);
		});
	});

	describe("malformed HTML handling", () => {
		test("should return empty array when card[data-product-id] is missing", () => {
			const html = `
				<li class="ais-InfiniteHits-item">
					<div class="main-product-card">
						<div class="card">
							<div class="card__inner">
								<img src="/images/book.jpg" alt="Book" />
							</div>
							<div class="card__heading">
								<a href="/en-gb/product/test-book-1" 
								   class="product-card"
								   data-item_id="1"
								   data-item_name="Test Book"
								   data-price="8.99">Test Book</a>
							</div>
						</div>
					</div>
				</li>
			`;
			const result = parseProductListHtml(html);
			expect(result).toHaveLength(0);
		});

		test("should return empty array when no valid products found", () => {
			const html = `
				<li class="ais-InfiniteHits-item">
					<div class="main-product-card">
						<div class="broken-structure">
							<span>Not a valid product</span>
						</div>
					</div>
				</li>
			`;
			const result = parseProductListHtml(html);
			expect(result).toHaveLength(0);
		});
	});

	describe("happy path - full product list parsing", () => {
		test("should parse all valid products from realistic HTML", () => {
			const result = parseProductListHtml(MOCK_HTML);

			expect(result.length).toBe(8);

			expect(result[0]).toMatchObject({
				sourceId: "12345",
				title: "The Great Gatsby",
				author: "F. Scott Fitzgerald",
				price: 8.99,
				currency: "GBP",
				imageUrl: "https://cdn.example.com/book1.jpg",
				url: "https://www.worldofbooks.com/en-gb/product/the-great-gatsby-12345",
				slug: "the-great-gatsby-12345",
			});

			expect(result[1]).toMatchObject({
				sourceId: "67890",
				title: "1984",
				author: "George Orwell",
				price: 12.5,
				currency: "USD",
				imageUrl: "https://www.worldofbooks.com/images/book2.jpg",
				url: "https://www.worldofbooks.com/en-gb/product/1984-67890",
				slug: "1984-67890",
			});

			expect(result[2]).toMatchObject({
				sourceId: "11111",
				title: "To Kill a Mockingbird",
				author: "Harper Lee",
				price: 15.75,
				currency: "USD",
				imageUrl: "https://cdn.example.com/book3.jpg",
				url: "https://www.worldofbooks.com/en-gb/product/to-kill-a-mockingbird-11111",
				slug: "to-kill-a-mockingbird-11111",
			});

			expect(result[3]).toMatchObject({
				sourceId: "22222",
				title: "Pride and Prejudice",
				author: "Jane Austen",
				price: 10.5,
				currency: "EUR",
				imageUrl: "https://www.worldofbooks.com/images/book4.jpg",
				url: "https://www.worldofbooks.com/en-gb/product/pride-and-prejudice-22222",
				slug: "pride-and-prejudice-22222",
			});

			expect(result[4]).toMatchObject({
				sourceId: "33333",
				title: "Jane Eyre",
				author: "Charlotte Brontë",
				price: 9.99,
				currency: "GBP",
				imageUrl: null,
				url: "https://www.worldofbooks.com/en-gb/product/jane-eyre-33333",
				slug: "jane-eyre-33333",
			});

			expect(result[5]).toMatchObject({
				sourceId: "44444",
				title: "Animal Farm",
				author: null,
				price: 7.5,
				currency: "GBP",
				imageUrl: "https://www.worldofbooks.com/images/book5.jpg",
				url: "https://www.worldofbooks.com/en-gb/product/animal-farm-44444",
				slug: "animal-farm-44444",
			});

			expect(result[6]).toMatchObject({
				sourceId: "66666",
				title: "Free Book",
				author: "Free Author",
				price: 0,
				currency: "GBP",
				imageUrl: "https://www.worldofbooks.com/images/book8.jpg",
				url: "https://www.worldofbooks.com/en-gb/product/free-book-66666",
				slug: "free-book-66666",
			});

			expect(result[7]).toMatchObject({
				sourceId: "99999",
				title: "Cheap Book",
				author: "Cheap Author",
				price: 5,
				currency: "GBP",
				imageUrl: "https://www.worldofbooks.com/images/book9.jpg",
				url: "https://www.worldofbooks.com/en-gb/product/cheap-book-99999",
				slug: "cheap-book-99999",
			});
		});
	});
});
