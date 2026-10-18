using System.Security.Claims;
using Microsoft.AspNetCore.Http;
using SistemaUOD.Application.Common.Interfaces;

namespace SistemaUOD.Infrastructure.Services;

public class CurrentUserService : ICurrentUserService
{
    private readonly IHttpContextAccessor _httpContextAccessor;

    public CurrentUserService(IHttpContextAccessor httpContextAccessor)
    {
        _httpContextAccessor = httpContextAccessor;
    }

    public Guid? UserId
    {
        get
        {
            var user = _httpContextAccessor.HttpContext?.User;
            var subClaim = user?.FindFirst(ClaimTypes.NameIdentifier)?.Value
                ?? user?.FindFirst("sub")?.Value;

            return Guid.TryParse(subClaim, out var id) ? id : null;
        }
    }

    public string? Email
    {
        get
        {
            var user = _httpContextAccessor.HttpContext?.User;
            return user?.FindFirst(ClaimTypes.Email)?.Value
                ?? user?.FindFirst("email")?.Value;
        }
    }

    public string? Role
    {
        get
        {
            var user = _httpContextAccessor.HttpContext?.User;
            return user?.FindFirst(ClaimTypes.Role)?.Value
                ?? user?.FindFirst("role")?.Value;
        }
    }

    public string? IpAddress
    {
        get
        {
            var httpContext = _httpContextAccessor.HttpContext;
            if (httpContext == null) return null;

            if (httpContext.Request.Headers.TryGetValue("X-Forwarded-For", out var forwarded))
            {
                return forwarded.FirstOrDefault()?.Split(',').FirstOrDefault()?.Trim();
            }

            return httpContext.Connection.RemoteIpAddress?.ToString();
        }
    }

    public bool IsAuthenticated => _httpContextAccessor.HttpContext?.User?.Identity?.IsAuthenticated ?? false;
}
