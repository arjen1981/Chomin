using Chomin.Api;

var builder = WebApplication.CreateBuilder(args);

// The PWA is served from a different origin; allow browser calls in Cloud mode.
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
        policy.AllowAnyOrigin().AllowAnyHeader().AllowAnyMethod());
});

var app = builder.Build();

app.UseCors();

// Optional translation fallback. No auth, no database. Only text is received —
// never camera frames — and only English dialogue is returned.
app.MapPost("/api/translate", (TranslateRequest request) =>
{
    var english = Translator.Translate(request.Japanese ?? string.Empty);
    return Results.Ok(new TranslateResponse(english));
});

app.Run();

// Exposed so the test project can use WebApplicationFactory<Program>.
public partial class Program;

namespace Chomin.Api
{
    public record TranslateRequest(string? Japanese);

    public record TranslateResponse(string English);

    /// <summary>
    /// MVP translation: a small dictionary of sample RPG lines with an
    /// English-only fallback. A real model can replace this behind the same
    /// contract without changing the client.
    /// </summary>
    public static class Translator
    {
        private static readonly Dictionary<string, string> Entries = new()
        {
            ["お前、本当に行くのか？"] = "You... are you really going?",
            ["街へ戻ろう"] = "Let's head back to town.",
            ["まて！"] = "Wait!",
            ["ありがとう"] = "Thank you.",
        };

        public static string Translate(string japanese)
        {
            var key = japanese.Trim();
            return Entries.TryGetValue(key, out var english)
                ? english
                : "(no translation available)";
        }
    }
}
