using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using backend.Data;
using backend.Models;
using Microsoft.AspNetCore.Http.HttpResults;

namespace Backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class PerfilController : ControllerBase
    {
        private readonly AppDbContext _context;

        public PerfilController(AppDbContext context)
        {
            _context = context;
        }

        // GET:
        [HttpGet]
        public async Task<ActionResult<Perfil>> GetPerfil()
        {
            var perfil = await _context.Perfis.FirstOrDefaultAsync();

            // SE FOR O PRIMEIRO ACESSO E A TABELA ESTIVER VAZIA, CRIA UM USUÁRIO INICIAL:
            if (perfil == null)
            {
                perfil = new Perfil
                {
                    Nome = "Dev",
                    Bio = "",
                    Cargo = "Desenvolvedor"
                };

                _context.Perfis.Add(perfil);
                await _context.SaveChangesAsync();
            }

            return Ok(perfil);
        }

        // PUT:
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdatePerfil(int id, [FromBody] Perfil perfilDto)
        {
            var perfil = await _context.Perfis.FindAsync(id);

            if (perfil == null)
            {
                return NotFound(new {message = "Perfil não encontrado no banco de dados."});
            }

            // ATUALIZA OS DADOS NO ONJETO C#:
            perfil.Nome = perfilDto.Nome;
            perfil.Bio = perfilDto.Bio;
            perfil.Cargo = perfilDto.Cargo;
            perfil.Status = perfilDto.Status;
            perfil.AtualizadoEm = DateTime.UtcNow;

            // PERSISTE AS ALTERAÇÕES NO BANCO DE DADOS VIA ENTITY FRAMEWORK:
            await _context.SaveChangesAsync();

            return Ok(perfil);
        }
    }
}