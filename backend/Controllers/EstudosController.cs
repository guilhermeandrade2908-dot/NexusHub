using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using backend.Data;
using backend.Models;

namespace backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class EstudosController : ControllerBase
    {
        private readonly AppDbContext _context;

        public EstudosController(AppDbContext context)
        {
            _context = context;
        }

        // GET:
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Estudo>>> GetEstudos()
        {
            return await _context.Estudos.ToListAsync();
        }

        // POST:
        [HttpPost]
        public async Task<ActionResult<Estudo>> PostEstudo(Estudo estudo)
        {
            
            estudo.UltimaAtualizacao = DateTime.UtcNow;
            
            _context.Estudos.Add(estudo);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetEstudos), new {id = estudo.Id}, estudo);
        }

        // PUT:
        [HttpPut("{id}")]
        public async Task<IActionResult> PutEstudo(int id, Estudo estudo)
        {
            if (id != estudo.Id) return BadRequest();

            var estudoExistente = await _context.Estudos.FindAsync(id);

            if (estudoExistente == null) return NotFound();

            estudoExistente.Materia = estudo.Materia;
            estudoExistente.Progresso = estudo.Progresso;
            estudoExistente.HorasHoje = estudo.HorasHoje;
            estudoExistente.HorasTotais = estudo.HorasTotais;
            estudoExistente.UltimaAtualizacao = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            return Ok(estudoExistente);
        }

        // DELETE;
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteEstudo(int id)
        {
            var estudo = await _context.Estudos.FindAsync(id);
            if (estudo == null) return NotFound();

            _context.Estudos.Remove(estudo);
            await _context.SaveChangesAsync();

            return NoContent();
        }
    }
}