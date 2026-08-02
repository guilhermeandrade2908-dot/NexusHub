using Backend.Data;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

// LÊ A CONEXÃO DO APPSETTINGS.JSON COM O BANCO DE DADOS:
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");

// REGISTRA O SERVIÇO DO MYSQL NO CONTAINER DE DEPENDÊNCIAS:
builder.Services.AddDbContext<AppDbContext>(options => 
    options.UseMySql(connectionString, ServerVersion.AutoDetect(connectionString)));

// LIBERA O CORS PARA QUE O JAVASCRIPT CONSIGA FAZER REQUISIÇÕES SEM BLOQUEIO:
builder.Services.AddCors(options =>
{
   options.AddPolicy("AllowFrontend", policy =>
   {
      policy.AllowAnyOrigin()
            .AllowAnyMethod()
            .AllowAnyHeader(); 
   });
});

builder.Services.AddControllers();

var app = builder.Build();

// CRIA O BANCO E AS TABELAS AUTOMATICAMENTE NO XAMPP SE AINDA NÃO EXISTIREM:
 using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    db.Database.EnsureCreated();
}

app.UseCors("AllowFrontend");
app.MapControllers();

app.Run();