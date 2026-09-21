using System.Net;
using System.Net.Http.Json;
using System.Text.RegularExpressions;
using Chomin.Api;
using Microsoft.AspNetCore.Mvc.Testing;
using Xunit;

namespace Chomin.Api.Tests;

public class TranslateEndpointTests : IClassFixture<WebApplicationFactory<Program>>
{
    private static readonly Regex Japanese =
        new(@"[\p{IsHiragana}\p{IsKatakana}\p{IsCJKUnifiedIdeographs}]");

    private readonly WebApplicationFactory<Program> _factory;

    public TranslateEndpointTests(WebApplicationFactory<Program> factory) => _factory = factory;

    [Fact]
    public async Task Returns_english_for_japanese_input()
    {
        var client = _factory.CreateClient();

        var response = await client.PostAsJsonAsync(
            "/api/translate",
            new { japanese = "ありがとう" });

        response.EnsureSuccessStatusCode();
        var body = await response.Content.ReadFromJsonAsync<TranslateResponse>();

        Assert.NotNull(body);
        Assert.False(string.IsNullOrWhiteSpace(body!.English));
        Assert.Equal("Thank you.", body.English);
    }

    [Fact]
    public async Task Response_never_contains_japanese()
    {
        var client = _factory.CreateClient();

        var response = await client.PostAsJsonAsync(
            "/api/translate",
            new { japanese = "未知のセリフ" });

        response.EnsureSuccessStatusCode();
        var body = await response.Content.ReadFromJsonAsync<TranslateResponse>();

        Assert.NotNull(body);
        Assert.DoesNotMatch(Japanese, body!.English);
    }

    [Fact]
    public async Task Anonymous_request_is_accepted_without_credentials()
    {
        var client = _factory.CreateClient();

        var response = await client.PostAsJsonAsync(
            "/api/translate",
            new { japanese = "まて！" });

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }
}
