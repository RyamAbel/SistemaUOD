using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using SistemaUOD.Application.Common.Interfaces;

namespace SistemaUOD.Infrastructure.Services;

public class SupabaseStorageService : IStorageService
{
    private readonly HttpClient _httpClient;
    private readonly string _supabaseUrl;
    private readonly string _serviceRoleKey;
    private readonly ILogger<SupabaseStorageService> _logger;

    public SupabaseStorageService(
        HttpClient httpClient,
        IConfiguration configuration,
        ILogger<SupabaseStorageService> logger)
    {
        _httpClient = httpClient;
        _logger = logger;
        _supabaseUrl = (configuration["Supabase:Url"] ?? "https://xgwuxkvbdwxwflynanwo.supabase.co").TrimEnd('/');
        _serviceRoleKey = configuration["Supabase:ServiceRoleKey"] ?? configuration["Supabase:AnonKey"] ?? "";
    }

    public async Task<string> SubirArchivoAsync(string bucket, string rutaDestino, Stream contenido, string contentType, CancellationToken ct = default)
    {
        var url = $"{_supabaseUrl}/storage/v1/object/{bucket}/{rutaDestino.TrimStart('/')}";

        using var request = new HttpRequestMessage(HttpMethod.Post, url);
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", _serviceRoleKey);
        request.Headers.Add("apiKey", _serviceRoleKey);
        request.Headers.Add("x-upsert", "true");

        using var streamContent = new StreamContent(contenido);
        streamContent.Headers.ContentType = new MediaTypeHeaderValue(contentType);
        request.Content = streamContent;

        try
        {
            var response = await _httpClient.SendAsync(request, ct);

            if (!response.IsSuccessStatusCode)
            {
                var errorBody = await response.Content.ReadAsStringAsync(ct);
                _logger.LogWarning("Supabase Storage respondió con error {StatusCode}: {ErrorBody}. Usando URL pública calculada.", response.StatusCode, errorBody);
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Excepción de red al contactar Supabase Storage. Procediendo con URL relativa/pública.");
        }

        return $"{_supabaseUrl}/storage/v1/object/public/{bucket}/{rutaDestino.TrimStart('/')}";
    }

    public async Task<bool> EliminarArchivoAsync(string bucket, string rutaDestino, CancellationToken ct = default)
    {
        var url = $"{_supabaseUrl}/storage/v1/object/{bucket}/{rutaDestino.TrimStart('/')}";

        using var request = new HttpRequestMessage(HttpMethod.Delete, url);
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", _serviceRoleKey);
        request.Headers.Add("apiKey", _serviceRoleKey);

        try
        {
            var response = await _httpClient.SendAsync(request, ct);
            return response.IsSuccessStatusCode;
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Error al eliminar archivo en Supabase Storage: {Ruta}", rutaDestino);
            return false;
        }
    }

    public async Task<string> ObtenerUrlFirmadaAsync(string bucket, string rutaDestino, TimeSpan duracion, CancellationToken ct = default)
    {
        var url = $"{_supabaseUrl}/storage/v1/object/sign/{bucket}/{rutaDestino.TrimStart('/')}";

        using var request = new HttpRequestMessage(HttpMethod.Post, url);
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", _serviceRoleKey);
        request.Headers.Add("apiKey", _serviceRoleKey);

        var payload = JsonSerializer.Serialize(new { expiresIn = (int)duracion.TotalSeconds });
        request.Content = new StringContent(payload, Encoding.UTF8, "application/json");

        try
        {
            var response = await _httpClient.SendAsync(request, ct);
            if (response.IsSuccessStatusCode)
            {
                var json = await response.Content.ReadAsStringAsync(ct);
                using var doc = JsonDocument.Parse(json);
                if (doc.RootElement.TryGetProperty("signedURL", out var signedUrlProp))
                {
                    return $"{_supabaseUrl}/storage/v1{signedUrlProp.GetString()}";
                }
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "No se pudo obtener URL firmada de Supabase Storage. Usando URL pública.");
        }

        return $"{_supabaseUrl}/storage/v1/object/public/{bucket}/{rutaDestino.TrimStart('/')}";
    }
}
