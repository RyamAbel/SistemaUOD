using System.Security.Claims;
using System.Text.Encodings.Web;
using Microsoft.AspNetCore.Authentication;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace SistemaUOD.Tests;

public class TestAuthHandlerOptions : AuthenticationSchemeOptions
{
    public string DefaultUserId { get; set; } = Guid.NewGuid().ToString();
    public string DefaultEmail { get; set; } = "test@uod.edu.do";
    public string DefaultRole { get; set; } = "super_admin";
}

public class TestAuthHandler : AuthenticationHandler<TestAuthHandlerOptions>
{
    public const string SchemeName = "TestScheme";

    public TestAuthHandler(
        IOptionsMonitor<TestAuthHandlerOptions> options,
        ILoggerFactory logger,
        UrlEncoder encoder) : base(options, logger, encoder)
    {
    }

    protected override Task<AuthenticateResult> HandleAuthenticateAsync()
    {
        // Si no se envía cabecera Authorization, no autenticamos
        if (!Request.Headers.ContainsKey("Authorization"))
        {
            return Task.FromResult(AuthenticateResult.NoResult());
        }

        var authHeader = Request.Headers.Authorization.ToString();
        if (authHeader.StartsWith("Bearer invalid", StringComparison.OrdinalIgnoreCase))
        {
            return Task.FromResult(AuthenticateResult.Fail("Token inválido"));
        }

        var userId = Request.Headers.TryGetValue("X-Test-UserId", out var customUserId)
            ? customUserId.ToString()
            : Options.DefaultUserId;

        var role = Request.Headers.TryGetValue("X-Test-Role", out var customRole)
            ? customRole.ToString()
            : Options.DefaultRole;

        var email = Request.Headers.TryGetValue("X-Test-Email", out var customEmail)
            ? customEmail.ToString()
            : Options.DefaultEmail;

        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, userId),
            new Claim("sub", userId),
            new Claim(ClaimTypes.Email, email),
            new Claim("email", email),
            new Claim(ClaimTypes.Role, role),
            new Claim("role", role),
            new Claim("aud", "authenticated")
        };

        var identity = new ClaimsIdentity(claims, SchemeName);
        var principal = new ClaimsPrincipal(identity);
        var ticket = new AuthenticationTicket(principal, SchemeName);

        return Task.FromResult(AuthenticateResult.Success(ticket));
    }
}
